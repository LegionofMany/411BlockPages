import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from 'lib/adminMiddleware';
import dbConnect from 'lib/db';
import Report from 'lib/reportModel';
import Provider from 'lib/providerModel';

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  await dbConnect();
  const agg = await Report.aggregate([
    { $match: { providerId: { $exists: true, $ne: null } } },
    { $group: { _id: '$providerId', totalReports: { $sum: 1 }, uniqueReporters: { $addToSet: '$reporterUserId' } } },
    { $project: { totalReports: 1, uniqueReporters: { $size: '$uniqueReporters' } } },
    { $sort: { totalReports: -1 } },
    { $limit: 5000 }
  ]);
  const ids = agg.map(a=>a._id);
  type ProviderLean = { _id: string; name?: string };
  const providersRaw = await Provider.find({ _id: { $in: ids } });
  const providers = Array.isArray(providersRaw) ? providersRaw as ProviderLean[] : (await (providersRaw as { lean?: () => Promise<ProviderLean[]> }).lean?.()) as ProviderLean[];
  const byId = providers.reduce((acc: Record<string, ProviderLean>, p: ProviderLean) => { acc[String(p._id)] = p; return acc; }, {} as Record<string, ProviderLean>);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="provider-stats.csv"');
  // CSV header
  res.write('providerId,providerName,totalReports,uniqueReporters\n');
  for (const a of agg){
    const id = String(a._id);
    const p = byId[id] || { name: '' };
    const line = `${id},"${(p.name|| '').replace(/"/g,'""')}",${a.totalReports},${a.uniqueReporters}\n`;
    res.write(line);
  }
  res.end();
});
