import { v2 as cloudinary } from 'cloudinary';

export function isCloudinaryConfigured(): boolean {
  return typeof process.env.CLOUDINARY_URL === 'string' && process.env.CLOUDINARY_URL.trim() !== '';
}

export function getCloudNameFromUrl(): string | null {
  const url = process.env.CLOUDINARY_URL || '';
  const m = url.match(/@([A-Za-z0-9_-]+)$/);
  return m ? m[1] : null;
}

export async function validateCloudinary(): Promise<boolean> {
  if (!isCloudinaryConfigured()) return false;
  try {
    cloudinary.config({ url: process.env.CLOUDINARY_URL });
    // perform a lightweight API call to confirm credentials
    await cloudinary.api.resources({ max_results: 1 });
    console.log('Cloudinary validated successfully');
    return true;
  } catch (err) {
    console.warn('Cloudinary validation failed:', err && (err as Error).message ? (err as Error).message : err);
    return false;
  }
}

// Run validation on module load in server environments to surface misconfigurations early.
if (typeof window === 'undefined') {
  validateCloudinary().catch(() => {});
}

export default cloudinary;
