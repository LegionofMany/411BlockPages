import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import dbConnect from 'lib/db';
import Report from 'lib/reportModel';
import Provider from 'lib/providerModel';

async function handler(req: NextApiRequest, res: NextApiResponse){
  await dbConnect();
  // aggregate reports per provider
  const agg = await Report.aggregate([
    { $match: { providerId: { $exists: true, $ne: null } } },
    { $group: { _id: "$providerId", totalReports: { $sum: 1 }, uniqueReporters: { $addToSet: "$reporterUserId" } } },
    { $project: { totalReports: 1, uniqueReporters: { $size: "$uniqueReporters" } } },
    { $sort: { totalReports: -1 } }
  ]).limit(500);
  // enrich with provider names
  type AggRow = { _id: unknown; totalReports: number; uniqueReporters: number };
  // normalize ids to strings for lookup
  const ids = agg.map((a: AggRow) => String(a._id));
  const providers = await Provider.find({ _id: { $in: ids } }).lean();
  const byId: Record<string, unknown> = providers.reduce((acc, p) => { const prov = p as unknown as { _id?: unknown }; acc[String(prov._id)] = p; return acc; }, {} as Record<string, unknown>);
  const out = (agg as AggRow[]).map(a => ({ provider: byId[String(a._id)] || null, totalReports: a.totalReports, uniqueReporters: a.uniqueReporters }));
  res.status(200).json(out);
}

export default withAdminAuth(handler);
