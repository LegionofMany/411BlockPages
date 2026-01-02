import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';

// This endpoint should be set as the webhook/callback URL in your KYC provider dashboard
// It expects a POST with applicant/user info and status
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  try {
    await dbConnect();
    const { externalUserId, reviewResult, reviewStatus } = req.body;
    if (!externalUserId) return res.status(400).json({ message: 'Missing externalUserId' });
    // Only mark as verified if review is completed and approved
    if (reviewStatus === 'completed' && reviewResult?.reviewAnswer === 'GREEN') {
      const user = await User.findById(externalUserId);
      if (user) {
        user.kycStatus = 'verified';
        user.kycVerifiedAt = new Date();
        await user.save();
      }
    }
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Webhook error' });
  }
}
