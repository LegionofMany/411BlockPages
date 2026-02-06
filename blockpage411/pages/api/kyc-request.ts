import type { NextApiRequest, NextApiResponse } from 'next';

// Back-compat endpoint.
// The current KYC model is wallet-only: users request a short-lived challenge message,
// sign it in their wallet, then submit the signature for immediate verification.
// Use:
// - POST /api/kyc/challenge
// - POST /api/kyc/verify

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  return res.status(410).json({
    success: false,
    message: 'This endpoint is retired. Use /api/kyc/challenge then /api/kyc/verify for wallet-only KYC verification.',
  });
}
