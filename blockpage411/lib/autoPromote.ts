import Provider from './providerModel';
import Report from './reportModel';
import dbConnect from './db';

export type PromoteOptions = {
  minReports?: number;
  minUniqueReporters?: number;
  limit?: number;
};

export async function findAutoPromoteCandidates(opts: PromoteOptions = {}){
  await dbConnect();
  const minReports = opts.minReports ?? 3;
  const minUnique = opts.minUniqueReporters ?? 2;
  const limit = opts.limit ?? 100;

  const agg = await Report.aggregate([
    { $match: { providerId: { $exists: true, $ne: null } } },
    { $group: { _id: '$providerId', totalReports: { $sum: 1 }, uniqueReporters: { $addToSet: '$reporterUserId' } } },
    { $project: { totalReports: 1, uniqueReporters: { $size: '$uniqueReporters' } } },
    { $match: { totalReports: { $gte: minReports }, uniqueReporters: { $gte: minUnique } } },
    { $sort: { totalReports: -1 } },
    { $limit: limit }
  ]);

    const ids = agg.map((a: { _id: unknown }) => a._id as unknown);
    const providers = await Provider.find({ _id: { $in: ids } }).lean();
    const byId: Record<string, unknown> = {};
    for (const p of providers) byId[String((p as { _id?: unknown })._id)] = p;

    return agg.map((a: { _id: unknown; totalReports: number; uniqueReporters: number }) => ({ provider: byId[String(a._id)] || null, totalReports: a.totalReports, uniqueReporters: a.uniqueReporters }));
}

  export async function promoteCandidates(candidates: Array<unknown>){
    if (!Array.isArray(candidates) || !candidates.length) return { updated: 0, promotedIds: [] };
    await dbConnect();
    let updated = 0;
    const promotedIds: string[] = [];
    for (const c of candidates){
      const cobj = c as { provider?: unknown; providerId?: unknown };
      const provider = cobj.provider || cobj.providerId;
      if (!provider) continue;
      let id = '';
      if (typeof provider === 'string' || typeof provider === 'number') {
        id = String(provider);
      } else {
        id = String((provider as { _id?: unknown })._id ?? provider);
      }
      const p = await Provider.findById(id);
      if (!p) continue;
      if (!p.readyForOutreach){
        p.readyForOutreach = true;
        await p.save();
        updated++;
        promotedIds.push(String(p._id));
      }
    }
    return { updated, promotedIds };
  }

const autoPromote = { findAutoPromoteCandidates, promoteCandidates };
export default autoPromote;
