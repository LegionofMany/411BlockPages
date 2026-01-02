import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import AuditLog from '../../../lib/auditLogModel';
import notifyEmail from '../../../lib/notifyEmail';
import sendKycEmail from '../../../utils/sendKycEmail';

// PATCH /api/admin/kyc-status
// Body: { address, chain, kycStatus: 'verified' | 'rejected' | 'pending' }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const { address, chain, kycStatus } = req.body;
  if (!address || !chain || !kycStatus) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!['verified', 'rejected', 'pending'].includes(kycStatus)) {
    return res.status(400).json({ message: 'Invalid kycStatus' });
  }
  await dbConnect();
  const wallet = await Wallet.findOne({ address, chain });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  wallet.kycStatus = kycStatus;
  if (kycStatus === 'verified') wallet.kycVerifiedAt = new Date();
  if (kycStatus === 'pending') wallet.kycRequestedAt = new Date();
  await wallet.save();
  
    // create an audit log entry
    try {
      await AuditLog.create({
        type: 'kyc.update',
        actor: (req.headers['x-admin-address'] as string) || 'admin',
        target: address,
        action: kycStatus === 'verified' ? 'verify' : kycStatus === 'rejected' ? 'reject' : 'set-pending',
        meta: { chain, kycStatus },
      });
    } catch (e) {
      console.warn('Failed to write audit log for kyc update', e);
    }
  
    // send KYC email to the user only if we have a verified email; otherwise notify admins
    try {
      const recipient = (wallet.kycDetails as any)?.email || (wallet.kycDetails as any)?.contactEmail || process.env.ADMIN_NOTIFICATION_EMAIL;
      const emailVerified = !!(wallet.kycDetails as any)?.emailVerified;
      if (recipient && (wallet.kycDetails as any)?.email && emailVerified) {
        await sendKycEmail({ to: (wallet.kycDetails as any).email, status: kycStatus === 'verified' ? 'approved' : 'rejected', address, chain, fullName: (wallet.kycDetails as any).fullName });
      } else {
        // fallback: notify admin email about the change
        if (kycStatus === 'verified') {
          await notifyEmail(`KYC verified: ${address}`, `KYC verified for ${address} on ${chain} by admin.`);
        } else if (kycStatus === 'rejected') {
          await notifyEmail(`KYC rejected: ${address}`, `KYC rejected for ${address} on ${chain} by admin.`);
        }
      }
    } catch (e) {
      console.warn('KYC email notify failed', e);
    }
  
    res.status(200).json({ success: true, kycStatus });
}

export default withAdminAuth(handler);
