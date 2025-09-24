import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Save uploaded avatars to /public/avatars
const uploadDir = path.join(process.cwd(), 'public', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const form = new formidable.IncomingForm({ uploadDir, keepExtensions: true });
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: 'Upload error', error: err.message });
    }
    let file: formidable.File | undefined;
    const avatarField = files.avatar;
    if (Array.isArray(avatarField)) {
      file = avatarField[0];
    } else if (avatarField) {
      file = avatarField as unknown as formidable.File;
    }
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Move file to /public/avatars with a unique name
    const ext = path.extname(file.originalFilename || file.newFilename);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const destPath = path.join(uploadDir, filename);
    fs.renameSync(file.filepath, destPath);
    // Return public URL
    const publicUrl = `/avatars/${filename}`;
    return res.status(200).json({ url: publicUrl });
  });
}
