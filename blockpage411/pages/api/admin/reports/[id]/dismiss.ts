import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from 'lib/adminMiddleware';
import dbConnect from 'lib/db';
import Report from 'lib/reportModel';
import Wallet from 'lib/walletModel';

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: 'id required' });
  await dbConnect();
  const report = await Report.findById(String(id));
  if (!report) return res.status(404).json({ message: 'report not found' });
  report.status = 'closed';
  await report.save();
  // Optionally remove mirrored wallet flag (best-effort)
  try{
    if (report.suspectAddress && report.chain){
      const wallet = await Wallet.findOne({ address: report.suspectAddress, chain: report.chain });
      if (wallet && Array.isArray(wallet.flags)){
        wallet.flags = wallet.flags.filter((f: { user?: string; reason?: string })=> !(f.user === report.reporterUserId && f.reason && f.reason.includes('Reported via provider')));
        await wallet.save();
      }
    }
  }catch(e){ console.warn('failed removing wallet flag', e); }
  res.status(200).json({ success: true });
});
