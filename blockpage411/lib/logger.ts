import { appendFileSync } from 'fs';
import { join } from 'path';

export function logWebhookError(msg: string) {
  try {
    const p = join(process.cwd(), 'logs');
    appendFileSync(join(p, 'webhook-errors.log'), `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // swallow write errors
  }
}
