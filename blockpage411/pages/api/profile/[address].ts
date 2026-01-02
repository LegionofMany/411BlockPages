import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { address } = req.query as { address?: string };
  if (!address) return res.status(400).json({ message: 'Address required' });
  const norm = String(address).toLowerCase();
  await dbConnect();
  const user = (await User.findOne({ address: norm }).lean()) as any;
  if (!user) return res.status(404).json({ message: 'Profile not found' });
  // return only public fields
  const out = {
    address: user.address,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl || user.nftAvatarUrl,
    bio: user.bio,
    socialLinks: user.socialLinks || {
      twitter: user.twitter,
      telegram: user.telegram,
      discord: user.discord,
      website: user.website,
      instagram: user.instagram,
      facebook: user.facebook,
      whatsapp: user.whatsapp,
    },
    featuredCharityId: user.featuredCharityId,
    updatedAt: user.updatedAt,
  };
  res.status(200).json(out);
}
