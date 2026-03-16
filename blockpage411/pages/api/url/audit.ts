import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import rateLimit from '../../../lib/rateLimit';
import UrlAudit from '../../../lib/urlAuditModel';
import { auditUrl } from '../../../services/urlAudit/auditUrl';
import { enqueueDynamicWorkerScan } from '../../../services/urlAudit/dynamicWorkerClient';
import { notifyAdmin } from '../../../lib/notify';
import notifyEmail from '../../../lib/notifyEmail';

function getSiteOrigin(req: NextApiRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.SITE_ORIGIN || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) throw new Error('cannot_determine_site_origin');
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'url is required' });
  }

  await dbConnect();

  const result = await auditUrl(url);

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
    createdAt: new Date(),
  });

  // If local dynamic scanning ran, no need to enqueue a worker.
  const hasLocalDynamic = !!(result.signals as any)?.dynamic?.enabled;

  // Option B: enqueue external dynamic analysis worker so it works on Vercel.
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
      // ignore enqueue errors; static audit is still useful
    }
  }

  const alertScore = Math.max(0, Math.min(100, parseInt(process.env.URL_AUDIT_ALERT_SCORE || '70', 10) || 70));
  if (result.riskScore >= alertScore) {
    const subject = `[Blockpage411] High-risk URL audit (${result.riskScore})`;
    const body = `URL: ${result.url}\nHost: ${result.hostname}\nScore: ${result.riskScore} (${result.riskCategory})\nReasons: ${result.reasons.join('; ')}`;
    await notifyAdmin(subject, { url: result.url, hostname: result.hostname, score: result.riskScore, reasons: result.reasons });
    await notifyEmail(subject, body);
  }

  return res.status(200).json({ audit: doc });
}
