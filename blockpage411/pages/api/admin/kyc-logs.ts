import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import dbConnect from '../../../lib/db';
import AuditLog from '../../../lib/auditLogModel';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const address = typeof req.query.address === 'string' ? req.query.address : undefined;
  await dbConnect();
  const filter: any = {};
  if (address) filter.target = address;
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.status(200).json({ results: logs });
}

export default withAdminAuth(handler);
