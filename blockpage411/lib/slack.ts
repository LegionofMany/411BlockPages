// Server-side Slack webhook helper for poller alerts
export type PollerAlertPayload = {
  level?: 'info' | 'warning' | 'error';
  text?: string; // fallback plain text
  fundraiserId?: string;
  fundraiserTitle?: string;
  txHash?: string;
  chain?: string;
  amount?: number | string;
  currency?: string;
};

function txExplorerUrl(chain: string | undefined, txHash: string | undefined) {
  if (!txHash) return undefined;
  const h = txHash;
  if (!chain) return `https://etherscan.io/tx/${h}`;
  switch (chain.toLowerCase()) {
    case 'ethereum': return `https://etherscan.io/tx/${h}`;
    case 'polygon': return `https://polygonscan.com/tx/${h}`;
    case 'bsc': return `https://bscscan.com/tx/${h}`;
    case 'bitcoin': return `https://blockstream.info/tx/${h}`;
    case 'solana': return `https://solscan.io/tx/${h}`;
    case 'tron': return `https://tronscan.org/#/transaction/${h}`;
    default: return undefined;
  }
}

function buildBlocks(p: PollerAlertPayload) {
  const title = p.fundraiserTitle ? `Fundraiser: ${p.fundraiserTitle}` : 'Poller alert';
  const lines: Array<Record<string, unknown>> = [];
  lines.push({ type: 'section', text: { type: 'mrkdwn', text: `*${title}*` } });
  const details: string[] = [];
  if (p.level) details.push(`*level:* ${p.level}`);
  if (p.amount !== undefined && p.currency) details.push(`*amount:* ${p.amount} ${p.currency}`);
  if (p.txHash) {
    const txUrl = txExplorerUrl(p.chain, p.txHash);
    if (txUrl) details.push(`*tx:* <${txUrl}|${String(p.txHash).slice(0, 12)}...>`);
    else details.push(`*tx:* ${String(p.txHash).slice(0, 12)}...`);
  }
  if (p.fundraiserId) {
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || '';
    const link = base ? `${base}/fundraisers/${encodeURIComponent(p.fundraiserId)}` : undefined;
    if (link) details.push(`*link:* <${link}|open fundraiser>`);
  }
  if (p.text) details.push(p.text);
  if (details.length) lines.push({ type: 'section', text: { type: 'mrkdwn', text: details.join('\n') } });
  lines.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `env: ${process.env.NODE_ENV || 'dev'}` }] });
  return lines;
}

export async function sendPollerAlert(payload: PollerAlertPayload) {
  const webhook = process.env.POLLER_SLACK_WEBHOOK;
  if (!webhook) {
    console.warn('sendPollerAlert: POLLER_SLACK_WEBHOOK not configured');
    return { ok: false, status: 0, error: 'missing_webhook' };
  }

  // Persist an Alert document before attempting delivery so we have an audit trail.
  const { default: dbConnect } = await import('./db');
  const { default: Alert } = await import('./alertModel');
  await dbConnect();
  const doc = await Alert.create({
    level: payload.level || 'info',
    fundraiserId: payload.fundraiserId,
    fundraiserTitle: payload.fundraiserTitle,
    txHash: payload.txHash,
    chain: payload.chain,
    amount: payload.amount,
    currency: payload.currency,
    message: payload.text,
    status: 'pending',
    attempts: 0,
    metadata: {},
  });

  // In serverless setups we will not rely on an external worker. Return the Alert id
  // so a cron-triggered serverless endpoint can retry sending pending alerts.
  return { ok: true, alertId: String(doc._id) };

  // Fallback: immediate sending with in-process retries (same as before)
  const maxAttempts = Number(process.env.SLACK_MAX_ATTEMPTS ?? 3);
  const baseDelay = Number(process.env.SLACK_BACKOFF_MS ?? 500);
  const body = {
    text: payload.text ?? `Poller alert: ${payload.fundraiserTitle ?? payload.fundraiserId ?? ''}`,
    blocks: buildBlocks(payload),
  };
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!webhook) {
        doc.status = 'failed';
        doc.lastError = 'missing_webhook';
        await doc.save();
        return { ok: false, status: 0, error: 'missing_webhook' };
      }
      const res = await fetch(String(webhook), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        lastErr = `status ${res.status} ${text}`;
        await doc.updateOne({ $inc: { attempts: 1 }, lastError: String(lastErr) }).exec();
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      await doc.updateOne({ status: 'sent', attempts: attempt, lastError: null }).exec();
      return { ok: true, status: res.status };
    } catch (err) {
      lastErr = err;
      await doc.updateOne({ $inc: { attempts: 1 }, lastError: String(err) }).exec();
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  await doc.updateOne({ status: 'failed', lastError: String(lastErr) }).exec();
  return { ok: false, status: 0, error: String(lastErr) };
}

// Resend an existing Alert (by id) without creating a duplicate Alert doc.
// This is used by background retry workers to retry failed deliveries.
export async function resendAlert(alertId: string) {
  const { default: dbConnect } = await import('./db');
  const { default: Alert } = await import('./alertModel');
  await dbConnect();
  const doc = await Alert.findById(alertId);
  if (!doc) throw new Error('Alert not found');

  const payload: PollerAlertPayload = {
    level: doc.level as PollerAlertPayload['level'],
    fundraiserId: doc.fundraiserId ?? undefined,
    fundraiserTitle: doc.fundraiserTitle ?? undefined,
    txHash: doc.txHash ?? undefined,
    chain: doc.chain ?? undefined,
    amount: doc.amount ?? undefined,
    currency: doc.currency ?? undefined,
    text: doc.message ?? undefined,
  };

  const webhook = process.env.POLLER_SLACK_WEBHOOK;
  if (!webhook) throw new Error('Missing POLLER_SLACK_WEBHOOK');

  const body = { text: payload.text ?? `Poller alert retry: ${payload.fundraiserTitle ?? payload.fundraiserId ?? ''}`, blocks: buildBlocks(payload) };

  const maxAttempts = Number(process.env.SLACK_MAX_ATTEMPTS ?? 3);
  const baseDelay = Number(process.env.SLACK_BACKOFF_MS ?? 500);

  let lastErr: unknown = null;
  for (let attempt = (doc.attempts || 0) + 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!webhook) throw new Error('Missing POLLER_SLACK_WEBHOOK');
      const res = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        lastErr = `status ${res.status} ${text}`;
        doc.attempts = attempt;
        doc.lastError = String(lastErr);
        await doc.save();
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      doc.status = 'sent';
      doc.attempts = attempt;
      doc.lastError = null;
      await doc.save();
      return { ok: true, status: 200 };
    } catch (err) {
      lastErr = err;
      doc.attempts = attempt;
      doc.lastError = String(err);
      await doc.save();
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  doc.status = 'failed';
  doc.lastError = String(lastErr);
  await doc.save();
  return { ok: false, error: String(lastErr) };
}

export function shortErrorSummary(e: unknown) {
  if (!e) return 'unknown error';
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  try {
    return typeof e === 'string' ? e : JSON.stringify(e).slice(0, 300);
  } catch {
    return String(e);
  }
}
