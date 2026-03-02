import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import sharp from 'sharp';
// Cloudinary support for persistent storage on Vercel
import { v2 as cloudinary } from 'cloudinary';

const IS_VERCEL = !!process.env.VERCEL;
const IS_PROD = process.env.NODE_ENV === 'production';
const REQUIRE_PERSISTENT_STORAGE = IS_VERCEL || IS_PROD;

let cloudinaryConfigured = false;
if (process.env.CLOUDINARY_URL) {
  try {
    cloudinary.config({ url: process.env.CLOUDINARY_URL });
    cloudinaryConfigured = true;
  } catch (e) {
    cloudinaryConfigured = false;
    console.warn('Invalid CLOUDINARY_URL', e);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const writeFile = promisify(fs.writeFile);

// Professional limits: accept up to 2 MB raw upload; resize to 256x256 and return a public URL
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB raw upload limit
const AVATAR_SIZE = 256; // square
const TARGET_AVATAR_BYTES = 150 * 1024; // try to compress to ~150 KB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const form = new formidable.IncomingForm({
    maxFileSize: MAX_FILE_BYTES,
    keepExtensions: true,
  });

  try {
    const parsed: any = await new Promise((resolve, reject) => {
      form.parse(req as any, (err: any, fields: any, files: any) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const files = parsed.files || {};
    const file = files.file || files.avatar;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const mimetype = (file.mimetype || file.type || '').toLowerCase();
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimetype)) return res.status(400).json({ message: 'Invalid file type. Allowed: jpg, png, webp' });

    // Read the uploaded temporary file
    const tmpPath = file.filepath || file.path || file.tempFilePath;
    if (!tmpPath || !fs.existsSync(tmpPath)) return res.status(400).json({ message: 'Upload failed' });

    // Use sharp to normalize/resize and convert to webp for smaller size.
    // Attempt progressive compression to hit TARGET_AVATAR_BYTES while keeping a safety floor.
    const minQuality = 30;
    let quality = 80;
    let buffer = await sharp(tmpPath)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality })
      .toBuffer();

    while (buffer.length > TARGET_AVATAR_BYTES && quality >= minQuality) {
      quality = Math.max(minQuality, quality - 10);
      buffer = await sharp(tmpPath)
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .webp({ quality })
        .toBuffer();
      if (quality === minQuality) break;
    }

    // If the processed image is still huge beyond the raw limit, reject
    if (buffer.length > MAX_FILE_BYTES) {
      return res.status(400).json({ message: 'Processed image exceeds maximum allowed size' });
    }

    // If Cloudinary is configured, upload there (required on Vercel)
    if (process.env.CLOUDINARY_URL && cloudinaryConfigured) {
      try {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'avatars', format: 'webp' }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          stream.end(buffer);
        });
        // cloudinary returns secure_url
        return res.status(200).json({ url: uploadResult.secure_url, size: buffer.length, provider: 'cloudinary' });
      } catch (e: any) {
        const msg = e && e.message ? e.message : String(e);
        console.warn('Cloudinary upload failed', msg);
        if (REQUIRE_PERSISTENT_STORAGE) {
          return res.status(500).json({
            message: 'Avatar upload storage is misconfigured (Cloudinary upload failed). Set a valid CLOUDINARY_URL on the server, or configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET for client uploads.',
          });
        }
        // dev-only: fall back to local storage
      }
    } else if (REQUIRE_PERSISTENT_STORAGE) {
      return res.status(500).json({
        message: 'Avatar upload storage is not configured. Set CLOUDINARY_URL on the server, or configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET for client uploads.',
      });
    }

    // Fallback: store under public/uploads/avatars (works for local/dev)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const outPath = path.join(uploadDir, filename);
    await writeFile(outPath, buffer);
    try {
      // attempt to remove the tmp uploaded file when present
      if (tmpPath && fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch (e) {
      // non-fatal
    }

    // Return a served API URL so we can attach caching headers and control access
    const publicUrl = `/api/avatar/${encodeURIComponent(filename)}`;
    return res.status(200).json({ url: publicUrl, size: buffer.length, provider: 'local' });
  } catch (err: any) {
    console.error('/api/avatar/upload error', err && err.message ? err.message : err);
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large (max 2 MB)' });
    }
    return res.status(500).json({ message: 'Upload failed' });
  }
}
