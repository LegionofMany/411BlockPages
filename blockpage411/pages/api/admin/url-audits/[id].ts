import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import { withAdminAuth } from '../../../../lib/adminMiddleware';
import UrlAudit from '../../../../lib/urlAuditModel';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const id = req.query.id;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'id is required' });
  }

  const audit = await UrlAudit.findById(id, '-__v').lean();
  if (!audit) return res.status(404).json({ message: 'Not found' });

  return res.status(200).json({ audit });
}

export default withAdminAuth(handler);
