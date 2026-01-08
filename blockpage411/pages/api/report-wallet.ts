import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import Report from '../../lib/reportModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { txHash, category, reporterUserId, suspectAddress, chain, evidence } = req.body || {};
  if (!txHash || !category || !suspectAddress || !chain) return res.status(400).json({ error: 'Missing required fields' });

  await dbConnect();

  try {
    const report = await Report.create({
      reporterUserId: reporterUserId || null,
      suspectAddress: suspectAddress.toLowerCase(),
      chain,
      evidence: Array.isArray(evidence) ? evidence : (evidence ? [evidence] : []),
      status: 'open'
    } as any);

    // Tag as community report in subsequent processing pipelines (not implemented here)

    return res.status(201).json({ ok: true, id: report._id });
  } catch (err) {
    console.error('report-wallet error', err);
    return res.status(500).json({ error: 'Failed to store report' });
  }
}
