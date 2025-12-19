#!/usr/bin/env ts-node
import 'dotenv/config';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const WEBHOOK_URL = process.env.GIVINGBLOCK_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/givingblock`;
const WEBHOOK_SECRET = process.env.GIVINGBLOCK_WEBHOOK_SECRET || '';

async function main() {
  if (!WEBHOOK_SECRET) {
    console.error('GIVINGBLOCK_WEBHOOK_SECRET is not configured');
    process.exit(1);
  }

  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: ts-node scripts/send_givingblock_webhook.ts <payload.json>');
    process.exit(1);
  }

  const path = resolve(process.cwd(), fileArg);
  const raw = readFileSync(path, 'utf8');
  const payload = JSON.parse(raw);
  const body = JSON.stringify(payload);

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(body, 'utf8');
  const signature = hmac.digest('hex');

  console.log('Sending signed GivingBlock webhook to', WEBHOOK_URL);

  const resp = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-givingblock-signature': signature,
    },
    body,
  });

  const text = await resp.text();
  console.log('Status:', resp.status);
  console.log('Body:', text);
}

main().catch((err) => {
  console.error('Error sending webhook:', err?.message || err);
  process.exit(1);
});
