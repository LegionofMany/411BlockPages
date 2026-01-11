import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import AuditLog from '../../../lib/auditLogModel';
import notifyEmail from '../../../lib/notifyEmail';
import sendKycEmail from '../../../utils/sendKycEmail';
import { notifyAdmin } from '../../../lib/notify';

// PATCH /api/admin/kyc-status
// Body: { address, chain, kycStatus: 'verified' | 'rejected' | 'pending' }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const body = (req.body || {}) as Record<string, any>;
  const { address, chain, kycStatus } = body;
  if (!address || !chain || !kycStatus) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const kycAllowed = ['verified', 'rejected', 'pending'];
  if (!kycAllowed.includes(kycStatus)) {
    return res.status(400).json({ message: 'Invalid kycStatus' });
  }

  // sanitize address and chain
  const sanitizedAddress = String(address).trim().toLowerCase();
  const sanitizedChain = String(chain).trim().toLowerCase();
  // basic address validation for common chains (ethereum/evm)
  if (sanitizedChain === 'eth' || sanitizedChain === 'ethereum') {
    if (!/^0x[a-f0-9]{40}$/.test(sanitizedAddress)) {
      return res.status(400).json({ message: 'Invalid Ethereum address' });
    }
  }
  await dbConnect();
  const wallet = await Wallet.findOne({ address: sanitizedAddress, chain: sanitizedChain });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  // Prevent accidental rapid duplicate updates
  const now = Date.now();
  if (wallet.kycStatus === kycStatus && wallet.kycVerifiedAt && (now - new Date(wallet.kycVerifiedAt).getTime()) < 60 * 1000) {
    return res.status(429).json({ message: 'Duplicate update too soon' });
  }

  wallet.kycStatus = kycStatus;
  if (kycStatus === 'verified') wallet.kycVerifiedAt = new Date();
  if (kycStatus === 'pending') wallet.kycRequestedAt = new Date();
  await wallet.save();
  
    // create an audit log entry
    try {
      await AuditLog.create({
        type: 'kyc.update',
        actor: (req.headers['x-admin-address'] as string) || 'admin',
        target: sanitizedAddress,
        action: kycStatus === 'verified' ? 'verify' : kycStatus === 'rejected' ? 'reject' : 'set-pending',
        meta: { chain: sanitizedChain, kycStatus },
      });
    } catch (e) {
      console.warn('Failed to write audit log for kyc update', e);
    }
  
    // send KYC email to the user only if we have a verified email; otherwise notify admins
    try {
      const recipient = (wallet.kycDetails as any)?.email || (wallet.kycDetails as any)?.contactEmail;
      const emailVerified = !!(wallet.kycDetails as any)?.emailVerified;
      if (recipient && emailVerified) {
        try {
          await sendKycEmail({ to: recipient, status: kycStatus === 'verified' ? 'approved' : 'rejected', address: sanitizedAddress, chain: sanitizedChain, fullName: (wallet.kycDetails as any).fullName });
        } catch (e) {
          console.warn('sendKycEmail failed', e);
          // fallback to admin notify
          await notifyEmail(`KYC ${kycStatus}: ${sanitizedAddress}`, `Failed to send KYC email to ${recipient}. Admins notified.`);
          await notifyAdmin(`KYC ${kycStatus} for ${sanitizedAddress} (email send failed)`, { address: sanitizedAddress, chain: sanitizedChain });
        }
      } else {
        // fallback: notify admin email/webhook about the change
        const adminMsg = `KYC ${kycStatus} for ${sanitizedAddress} on ${sanitizedChain} by admin.`;
        try {
          if (process.env.ADMIN_NOTIFICATION_EMAIL) await notifyEmail(`KYC ${kycStatus}: ${sanitizedAddress}`, adminMsg);
        } catch (e) {
          console.warn('notifyEmail fallback failed', e);
        }
        try {
          await notifyAdmin(`KYC ${kycStatus}: ${sanitizedAddress}`, { address: sanitizedAddress, chain: sanitizedChain });
        } catch (e) {
          console.warn('notifyAdmin fallback failed', e);
        }
      }
    } catch (e) {
      console.warn('KYC email notify failed', e);
    }
  
    res.status(200).json({ success: true, kycStatus });
}

export default withAdminAuth(handler);
