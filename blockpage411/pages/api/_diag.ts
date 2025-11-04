import type { NextApiRequest, NextApiResponse } from 'next'

// Diagnostic endpoint to check runtime environment and request details.
// This intentionally does NOT return secret values. It only reports presence
// of key environment variables and some request info to help debug 404s.

const KEYS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NEXT_PUBLIC_ADMIN_WALLETS',
  'ADMIN_WALLETS',
  'ABLY_API_KEY',
  'PUBLISH_URL',
  'NEXT_PUBLIC_APP_URL',
]

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const envPresence: Record<string, boolean> = {}
  for (const k of KEYS) {
    envPresence[k] = typeof process.env[k] !== 'undefined' && process.env[k] !== ''
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    path: req.url,
    method: req.method,
    headers: {
      host: req.headers.host,
      'x-vercel-id': req.headers['x-vercel-id'] || null,
      'x-forwarded-host': req.headers['x-forwarded-host'] || null,
    },
    envPresence,
    note: 'This endpoint only reports presence of env vars, not their values.'
  })
}
