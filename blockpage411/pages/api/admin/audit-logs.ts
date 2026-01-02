import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import AuditLog from '../../../lib/auditLogModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const admin = req.headers['x-admin-address']?.toString().toLowerCase();
  if (!admin) return res.status(403).json({ message: 'Not authorized' });

  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const pageSize = Math.min(200, Math.max(1, parseInt((req.query.pageSize as string) || '20', 10)));
  const address = (req.query.address as string) || undefined;

  const filter: any = {};
  if (address) filter.target = address;

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean();

  res.status(200).json({ logs, total, page, pageSize });
}
