import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import sharp from 'sharp';
// Cloudinary support for persistent storage on Vercel
import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_URL) {
  try {
    cloudinary.config({ url: process.env.CLOUDINARY_URL });
  } catch (e) {
    console.warn('Invalid CLOUDINARY_URL', e);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const writeFile = promisify(fs.writeFile);

// Professional limits: accept up to 3 MB; resize to 256x256 and return a public URL under /uploads/avatars
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB
const AVATAR_SIZE = 256; // square

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

    const mimetype = file.mimetype || file.type || '';
    if (!mimetype.startsWith('image/')) return res.status(400).json({ message: 'Invalid file type' });

    // Read the uploaded temporary file
    const tmpPath = file.filepath || file.path || file.tempFilePath;
    if (!tmpPath || !fs.existsSync(tmpPath)) return res.status(400).json({ message: 'Upload failed' });

    // Use sharp to normalize/resize and convert to webp for smaller size
    const buffer = await sharp(tmpPath)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    if (buffer.length > MAX_FILE_BYTES) {
      // if the processed image still exceeds limit, reject
      return res.status(400).json({ message: 'Processed image exceeds maximum allowed size' });
    }

    // If Cloudinary is configured, upload there (recommended for Vercel)
    if (process.env.CLOUDINARY_URL) {
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
        console.warn('Cloudinary upload failed, falling back to local storage', e && e.message ? e.message : e);
        // continue to local storage fallback
      }
    }

    // Fallback: store under public/uploads/avatars (works for local/dev)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const outPath = path.join(uploadDir, filename);
    await writeFile(outPath, buffer);

    // Return a served API URL so we can attach caching headers and control access
    const publicUrl = `/api/avatar/${encodeURIComponent(filename)}`;
    return res.status(200).json({ url: publicUrl, size: buffer.length, provider: 'local' });
  } catch (err: any) {
    console.error('/api/avatar/upload error', err && err.message ? err.message : err);
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large (max 3 MB)' });
    }
    return res.status(500).json({ message: 'Upload failed' });
  }
}
