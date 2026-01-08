import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../../lib/adminMiddleware';
import dbConnect from '../../../../lib/db';
import Report from '../../../../lib/reportModel';

function toCsvRow(r: any) {
  return [
    String(r._id || ''),
    String(r.suspectAddress || ''),
    String(r.chain || ''),
    String(r.status || ''),
    String(r.reporterUserId || ''),
    String(r.providerId || ''),
    String(Array.isArray(r.evidence) ? r.evidence.length : 0),
    String(r.createdAt || r.updatedAt || ''),
  ];
}

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();

  const filter: any = {};
  if (req.query.chain) filter.chain = String(req.query.chain);
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.address) filter.suspectAddress = String(req.query.address).toLowerCase();
  if (req.query.reporter) filter.reporterUserId = String(req.query.reporter).toLowerCase();

  // safety: cap export size
  const limit = Math.min(5000, Number(req.query.limit || 2000));
  const items = await Report.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const headers = ['id','suspectAddress','chain','status','reporterUserId','providerId','evidenceCount','createdAt'];
  const rows = [headers.join(',')].concat(items.map(i => toCsvRow(i).map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')));

  const csv = rows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="reports_export.csv"');
  return res.status(200).send(csv);
});
