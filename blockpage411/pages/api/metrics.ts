import type { NextApiRequest, NextApiResponse } from 'next';
import { getRedisClient } from '../../lib/redisCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = getRedisClient();
  const incr = async (k: string) => {
    try {
      await client?.incr(k);
    } catch {
      // ignore
    }
  };

  // Support GET to expose metrics
  if (req.method === 'GET') {
    try {
      const verify = Number(await client?.get('metrics:verify_calls') ?? 0);
      const poller = Number(await client?.get('metrics:poller_runs') ?? 0);
      const lines = [];
      lines.push(`# HELP blockpage_verify_calls Total verify-onchain calls`);
      lines.push(`# TYPE blockpage_verify_calls counter`);
      lines.push(`blockpage_verify_calls ${verify}`);
      lines.push(`# HELP blockpage_poller_runs Total poller runs`);
      lines.push(`# TYPE blockpage_poller_runs counter`);
      lines.push(`blockpage_poller_runs ${poller}`);
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      return res.status(200).send(lines.join('\n'));
    } catch {
      return res.status(500).send('error');
    }
  }

  // POST increments counters (used internally)
  if (req.method === 'POST') {
    const metric = req.body?.metric;
    if (metric === 'verify') await incr('metrics:verify_calls');
    if (metric === 'poller') await incr('metrics:poller_runs');
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
