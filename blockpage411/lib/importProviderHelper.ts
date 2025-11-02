import Provider from './providerModel';
import ProviderWallet from './providerWalletModel';

type ImportOptions = {
  batchSize?: number;
  dryRun?: boolean;
  retryAttempts?: number;
  // zero-based index to start processing from (useful for resume)
  startIndex?: number;
  // progress callback: (processedCount, totalItems, lastIndexProcessed) => void
  onProgress?: (processed: number, total: number, lastIndex: number) => void;
};

type ImportItem = {
  providerId?: string;
  providerName?: string;
  provider?: string;
  name?: string;
  address?: string;
  addr?: string;
  wallet?: string;
  chain?: string;
  note?: string;
  source?: string;
};

/**
 * Import a list of provider-wallet mapping items.
 * This uses a provider cache and MongoDB bulkWrite in batches for large-scale imports.
 */
export async function importItems(items: Array<ImportItem>, options: ImportOptions = {}){
  const batchSize = options.batchSize ?? 1000;
  const dryRun = options.dryRun ?? false;
  const retryAttempts = options.retryAttempts ?? 2;
  const startIndex = options.startIndex ?? 0;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : undefined;

  // Build provider cache: map lowercase name/alias -> providerId where possible.
  let providerCache = new Map<string, string>();
  // narrow typing: treat Mongoose models as unknown with known methods
  const providerModel = Provider as unknown as { find?: (...args: unknown[]) => unknown; findOne?: (...args: unknown[]) => unknown };
  let providerFindAvailable = typeof providerModel.find === 'function';
  if (providerFindAvailable) {
    try {
      const providers = await (providerModel.find as (...a: unknown[]) => Promise<unknown>)({}).then((r: unknown) => {
        if (Array.isArray(r)) return r as unknown[];
        const rr = r as unknown as Record<string, unknown>;
        if (typeof rr['lean'] === 'function') return (rr['lean'] as () => unknown[])();
        return [] as unknown[];
      }) as unknown[];
      for (const p of providers){
        const pid = (p as unknown as { _id?: unknown })._id;
        const id = pid ? String(pid) : null;
        if (!id) continue;
        const name = (p as unknown as { name?: unknown }).name;
        if (name) providerCache.set(String(name).toLowerCase(), id);
        const aliases = (p as unknown as { aliases?: unknown }).aliases;
        if (Array.isArray(aliases)){
          for (const a of aliases as unknown[]) providerCache.set(String(a).toLowerCase(), id);
        }
      }
    } catch {
      // If the provider model is mocked without `.find`, fall back to on-demand lookups
      providerCache = new Map();
      providerFindAvailable = false;
    }
  }

  let inserted = 0, updated = 0, skipped = 0;
  type BulkUpdateOp = { updateOne: { filter: Record<string, unknown>; update: { $set?: Record<string, unknown>; $setOnInsert?: Record<string, unknown> }; upsert?: boolean } };
  const ops: BulkUpdateOp[] = [];
  let processed = 0;

  const flush = async () => {
    if (!ops.length) return { inserted: 0, updated: 0 };
    if (dryRun) { const copy = ops.length; ops.length = 0; return { inserted: copy, updated: 0 }; }
    for (let attempt = 0; attempt <= retryAttempts; attempt++){
      try{
        const pwModel = ProviderWallet as unknown as { bulkWrite?: (...args: unknown[]) => unknown; findOne?: (...args: unknown[]) => unknown; updateOne?: (...args: unknown[]) => unknown; create?: (...args: unknown[]) => unknown };
        if (typeof pwModel.bulkWrite === 'function'){
          const res = await (pwModel.bulkWrite as (...a: unknown[]) => Promise<unknown>)(ops, { ordered: false });
          const upserts = (res as unknown as { upsertedCount?: number }).upsertedCount || 0;
          const mods = (res as unknown as { modifiedCount?: number }).modifiedCount || 0;
          ops.length = 0;
          processed += upserts + mods;
          if (onProgress) onProgress(processed, items.length, currentIndex - 1);
          return { inserted: upserts, updated: mods };
        }
        // Fallback for models mocked without bulkWrite: apply ops one-by-one
        let upserts = 0, mods = 0;
        for (const o of ops){
          const filter = o.updateOne.filter;
          const update = o.updateOne.update;
          const existing = await (pwModel.findOne as (...a: unknown[]) => Promise<unknown>)(filter as unknown);
          if (existing){
            // apply $set fields
            if (update.$set) await (pwModel.updateOne as (...a: unknown[]) => Promise<unknown>)(filter as unknown, { $set: update.$set });
            mods++;
          } else {
            // create document merging setOnInsert and filter and set
            const doc: Record<string, unknown> = { ...filter } as Record<string, unknown>;
            if (update.$setOnInsert) Object.assign(doc, update.$setOnInsert);
            if (update.$set) Object.assign(doc, update.$set);
            await (pwModel.create as (...a: unknown[]) => Promise<unknown>)(doc as unknown);
            upserts++;
          }
        }
        ops.length = 0;
        processed += upserts + mods;
        if (onProgress) onProgress(processed, items.length, currentIndex - 1);
        return { inserted: upserts, updated: mods };
      }catch{
        if (attempt === retryAttempts) throw new Error('Bulk import failed after retries');
        // brief backoff
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }
    return { inserted: 0, updated: 0 };
  };
  // iterate with index so we can start from `startIndex` for resume
  let currentIndex = 0;
  for (const it of items){
    if (currentIndex < startIndex) { currentIndex++; continue; }
    try{
      let providerId = it.providerId || null;
      const pname = (it.providerName || it.provider || it.name || '').toString().trim();
      if (!providerId && pname){
        providerId = providerCache.get(pname.toLowerCase()) || null;
      }
      // If provider cache wasn't populated (e.g. in tests where model is stubbed), do on-demand findOne lookups
      if (!providerId && !providerFindAvailable && pname){
        try{
          const provModel = Provider as unknown as { findOne?: (...args: unknown[]) => Promise<unknown> };
          let p = await (provModel.findOne as (...a: unknown[]) => Promise<unknown>)({ name: pname } as unknown).catch(() => null);
          if (!p) p = await (provModel.findOne as (...a: unknown[]) => Promise<unknown>)({ aliases: pname } as unknown).catch(() => null);
          if (!p) p = await (provModel.findOne as (...a: unknown[]) => Promise<unknown>)({ name: new RegExp('^' + pname + '$', 'i') } as unknown).catch(() => null);
          if (!p) p = await (provModel.findOne as (...a: unknown[]) => Promise<unknown>)({ aliases: new RegExp('^' + pname + '$', 'i') } as unknown).catch(() => null);
          if (!p) p = await (provModel.findOne as (...a: unknown[]) => Promise<unknown>)({ name: new RegExp(pname, 'i') } as unknown).catch(() => null);
          if (p) providerId = (p as unknown as { _id?: unknown })._id?.toString() || null;
  }catch{ /* ignore */ }
      }
      if (!providerId && it.providerId){
        providerId = it.providerId; // allow direct ids
      }
      if (!providerId){
        console.warn('Skipping item with no providerId or providerName:', pname || it);
        skipped++;
        continue;
      }

      const address = String(it.address || it.addr || it.wallet || '').toLowerCase().trim();
      const chain = String(it.chain || 'ethereum').toLowerCase().trim();
      if (!address) { skipped++; continue; }

  const filter = { providerId, address, chain };
  const update: { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> } = { $set: { note: it.note || undefined, source: it.source || undefined, updatedAt: new Date() }, $setOnInsert: { providerId, address, chain, createdAt: new Date() } };

      ops.push({ updateOne: { filter, update, upsert: true } });

      if (ops.length >= batchSize){
        const r = await flush();
        inserted += r.inserted;
        updated += r.updated;
        // also invoke progress for items processed in this batch
        if (onProgress) onProgress(processed, items.length, currentIndex);
      }
      currentIndex++;
    }catch(e: unknown){
      const msg = e && typeof e === 'object' && 'message' in e ? (e as { message?: string }).message : String(e);
      console.warn('Error importing item', it, msg);
    }
  }

  const r = await flush();
  inserted += r.inserted;
  updated += r.updated;

  return { inserted, updated, skipped };
}

export default importItems;
