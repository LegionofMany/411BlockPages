import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import UrlAudit from '../../../lib/urlAuditModel';
import { verifyDynamicWorkerSignature } from '../../../services/urlAudit/dynamicWorkerClient';
import { scoreDynamicSignals } from '../../../services/urlAudit/dynamicScoring';
import { notifyAdmin } from '../../../lib/notify';
import notifyEmail from '../../../lib/notifyEmail';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

function categoryForScore(score: number): 'green' | 'yellow' | 'red' {
  if (score > 60) return 'red';
  if (score > 25) return 'yellow';
  return 'green';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const secret = process.env.DYNAMIC_WORKER_SECRET || '';
  if (!secret) {
    return res.status(500).json({ message: 'Dynamic worker callback is not configured' });
  }

  const signature = String(req.headers['x-bp411-signature'] || '').trim();
  const raw = await readRawBody(req);

  if (!verifyDynamicWorkerSignature(secret, raw, signature)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  const auditId = body?.auditId;
  if (!auditId || typeof auditId !== 'string') {
    return res.status(400).json({ message: 'auditId is required' });
  }

  const dynamic = body?.dynamic;
  if (!dynamic || typeof dynamic !== 'object') {
    return res.status(400).json({ message: 'dynamic is required' });
  }

  await dbConnect();

  const existing = await UrlAudit.findById(auditId);
  if (!existing) return res.status(404).json({ message: 'Not found' });

  const existingSignals = (existing as any).signals || {};

  const workerStatus = existingSignals?.dynamic?.worker?.status;
  if (workerStatus === 'completed') {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const prevScore = Number(existing.riskScore || 0);
  const baseScore = typeof existingSignals.scoreBase === 'number' ? existingSignals.scoreBase : Number(existing.riskScore || 0);
  const baseReasons = Array.isArray(existingSignals.reasonsBase)
    ? existingSignals.reasonsBase
    : Array.isArray(existing.reasons)
      ? existing.reasons
      : [];

  const dynScore = scoreDynamicSignals({ enabled: !!dynamic.enabled, walletRequests: dynamic.walletRequests, clicked: dynamic.clicked });

  const nextScore = clampScore(Number(baseScore || 0) + dynScore.delta);
  const nextReasons = Array.from(new Set([...(baseReasons || []), ...(dynScore.reasons || [])]));
  const nextCategory = categoryForScore(nextScore);

  const receivedAt = new Date().toISOString();

  const nextSignals = {
    ...existingSignals,
    scoreBase: baseScore,
    scoreDynamicDelta: dynScore.delta,
    reasonsBase: baseReasons,
    reasonsDynamic: dynScore.reasons,
    dynamic: {
      ...(existingSignals.dynamic || {}),
      ...dynamic,
      source: 'worker',
      receivedAt,
      worker: {
        status: 'completed',
        jobId: body?.jobId ? String(body.jobId) : undefined,
      },
    },
  };

  existing.riskScore = nextScore;
  (existing as any).riskCategory = nextCategory;
  existing.reasons = nextReasons;
  (existing as any).signals = nextSignals;

  await existing.save();

  const alertScore = Math.max(0, Math.min(100, parseInt(process.env.URL_AUDIT_ALERT_SCORE || '70', 10) || 70));
  if (prevScore < alertScore && nextScore >= alertScore) {
    const subject = `[Blockpage411] High-risk URL audit (dynamic) (${nextScore})`;
    const bodyText = `URL: ${existing.url}\nHost: ${existing.hostname}\nScore: ${nextScore} (${nextCategory})\nReasons: ${nextReasons.join('; ')}`;
    await notifyAdmin(subject, { url: existing.url, hostname: existing.hostname, score: nextScore, reasons: nextReasons });
    await notifyEmail(subject, bodyText);
  }

  return res.status(200).json({ ok: true });
}
