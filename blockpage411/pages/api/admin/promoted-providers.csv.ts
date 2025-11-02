import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';
import AdminAction from 'lib/adminActionModel';
import sentry from 'lib/sentry';

function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(c => {
    if (c == null) return '';
    const s = String(c);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',')).join('\n');
}

async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  try{
    const providers = await Provider.find({ readyForOutreach: true }).lean();
    const rows = [['_id','name','aliases','type','website','rank','status','readyForOutreach','reportsCount','uniqueReporters','createdAt','updatedAt']];
    for (const p of providers){
      const prov = p as unknown as {
        _id?: unknown;
        name?: string;
        aliases?: string[];
        type?: string;
        website?: string;
        rank?: number;
        status?: string;
        readyForOutreach?: boolean;
        reportsCount?: number;
        uniqueReporters?: number;
        createdAt?: string | Date;
        updatedAt?: string | Date;
      };
      rows.push([
        String(prov._id || ''),
        prov.name || '',
        Array.isArray(prov.aliases) ? prov.aliases.join('|') : '',
        prov.type || '',
        prov.website || '',
        String(prov.rank || ''),
        prov.status || '',
        String(Boolean(prov.readyForOutreach)),
        String(prov.reportsCount || 0),
        String(prov.uniqueReporters || 0),
        prov.createdAt ? new Date(prov.createdAt).toISOString() : '',
        prov.updatedAt ? new Date(prov.updatedAt).toISOString() : '',
      ]);
    }

    const csv = toCsv(rows);
    // record export in audit log
    try{
      const admin = (req.headers['x-admin-address'] || '').toString();
      await AdminAction.create({ admin: admin || 'unknown', action: 'export_promoted_providers', target: '', reason: `export_count=${providers.length}` });
    }catch(ae){
      sentry.captureException(ae);
      console.warn('[promoted-providers.csv] audit log failed', ae && (ae as Error).message);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="promoted-providers.csv"');
    res.status(200).send(csv);
  }catch(e){
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[promoted-providers.csv] error', msg);
    res.status(500).json({ message: 'internal error', error: msg });
  }
}

export default withAdminAuth(handler);
