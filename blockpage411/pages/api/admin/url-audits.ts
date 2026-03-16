import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import { withAdminAuth, getVerifiedAdminAddress } from '../../../lib/adminMiddleware';
import UrlAudit from '../../../lib/urlAuditModel';
import { auditUrl } from '../../../services/urlAudit/auditUrl';
import { enqueueDynamicWorkerScan } from '../../../services/urlAudit/dynamicWorkerClient';

function getSiteOrigin(req: NextApiRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) throw new Error('cannot_determine_site_origin');
  return `${proto}://${host}`;
}

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

    const hasLocalDynamic = !!(result.signals as any)?.dynamic?.enabled;
    const workerUrl = (process.env.DYNAMIC_WORKER_URL || '').trim();
    const workerSecret = (process.env.DYNAMIC_WORKER_SECRET || '').trim();

    if (!hasLocalDynamic && workerUrl && workerSecret) {
      try {
        const origin = getSiteOrigin(req);
        const callbackUrl = `${origin}/api/url/audit-dynamic-callback`;
        const requestedAt = new Date().toISOString();

        const enqueue = await enqueueDynamicWorkerScan({
          workerUrl,
          workerSecret,
          auditId: String((doc as any)._id),
          url: result.finalUrl || result.normalizedUrl || result.url,
          callbackUrl,
          requestedAt,
          timeoutMs: 1800,
        });

        const existingSignals = (doc as any).signals || {};
        const existingDynamic = existingSignals.dynamic || {};
        (doc as any).signals = {
          ...existingSignals,
          dynamic: {
            ...existingDynamic,
            worker: {
              status: enqueue.ok ? 'pending' : 'failed',
              jobId: enqueue.jobId,
              requestedAt,
              error: enqueue.ok ? undefined : enqueue.error,
            },
          },
        };
        await doc.save();
      } catch {
        // ignore enqueue errors
      }
    }

    return res.status(200).json({ audit: doc });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
