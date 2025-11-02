import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import dbConnect from 'lib/db';
import autoPromote from 'lib/autoPromote';
import AdminAction from 'lib/adminActionModel';
import sentry from 'lib/sentry';

async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { dryRun, minReports, minUniqueReporters, limit } = req.body || {};
  await dbConnect();
  try{
    const candidates = await autoPromote.findAutoPromoteCandidates({ minReports, minUniqueReporters, limit });
    if (dryRun) return res.status(200).json({ dryRun: true, candidates });
    const result = await autoPromote.promoteCandidates(candidates);
    // record audit actions for each promoted provider
    try{
      const admin = (req.headers['x-admin-address'] || '').toString();
      if (Array.isArray(result.promotedIds) && result.promotedIds.length){
        const now = new Date();
        const actions = result.promotedIds.map(id => ({ admin: admin || 'unknown', action: 'promote_provider', target: String(id), reason: `auto_promote: promoted by criteria minReports=${minReports} minUnique=${minUniqueReporters}`, timestamp: now }));
        // bulk insert - use a safe typed array
        await AdminAction.insertMany(actions as Array<Record<string, unknown>>);
      }
    }catch(ae){
      // don't fail the main request if audit logging fails
      sentry.captureException(ae);
      console.warn('[auto-promote] audit log failed', ae && (ae as Error).message);
    }

    return res.status(200).json({ dryRun: false, promoted: result.updated, promotedIds: result.promotedIds || [], candidates });
  }catch(e){
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[auto-promote] error', msg);
    sentry.captureException(e);
    return res.status(500).json({ message: 'internal error', error: msg });
  }
}

export default withAdminAuth(handler);
