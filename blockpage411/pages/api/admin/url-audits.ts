import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import { withAdminAuth, getVerifiedAdminAddress } from '../../../lib/adminMiddleware';
import UrlAudit from '../../../lib/urlAuditModel';
import { auditUrl } from '../../../services/urlAudit/auditUrl';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    const limit = typeof req.query.limit === 'string' ? Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25)) : 25;

    const audits = await UrlAudit.find(
      {},
      '-__v'
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ audits });
  }

  if (req.method === 'POST') {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }

    const result = await auditUrl(url);

    const actor = getVerifiedAdminAddress(req);

    const doc = await UrlAudit.create({
      url: result.url,
      finalUrl: result.finalUrl,
      hostname: result.hostname,
      statusCode: result.statusCode,
      contentType: result.contentType,
      truncated: result.truncated,
      riskScore: result.riskScore,
      riskCategory: result.riskCategory,
      reasons: result.reasons,
      signals: result.signals,
      actor,
      createdAt: new Date(),
    });

    return res.status(200).json({ audit: doc });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
