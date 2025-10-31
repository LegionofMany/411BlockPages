/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: any;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const userAddress = payload?.address;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });
  const { address, message, signature } = req.body;
  if (!address || !message || !signature) return res.status(400).json({ message: 'address, message and signature required' });
  try{
    const recovered = verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) return res.status(400).json({ message: 'Signature does not match address' });
    await dbConnect();
    const wallet = await Wallet.findOne({ address });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    wallet.verificationProof = { message, signature, recovered, verifiedAt: new Date(), verifiedBy: userAddress };
    wallet.verified = true;
    await wallet.save();
    res.status(200).json({ success: true });
  } catch (e:any) {
    console.error('verify error', e);
    res.status(500).json({ message: 'Verification failed' });
  }
}
