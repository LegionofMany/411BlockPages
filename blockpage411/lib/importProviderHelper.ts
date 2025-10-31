/* eslint-disable @typescript-eslint/no-explicit-any */
import Provider from './providerModel';
import ProviderWallet from './providerWalletModel';

export async function importItems(items: Array<any>){
  let inserted = 0, updated = 0;
  for (const it of items){
    try{
      let providerId = it.providerId || null;
      if (!providerId && it.providerName){
        // try name or aliases
        let p = await Provider.findOne({ name: it.providerName });
        if (!p) p = await Provider.findOne({ aliases: it.providerName });
        if (!p) p = await Provider.findOne({ name: new RegExp('^' + it.providerName + '$', 'i') });
        if (!p) p = await Provider.findOne({ aliases: new RegExp('^' + it.providerName + '$', 'i') });
        if (!p) p = await Provider.findOne({ name: new RegExp(it.providerName, 'i') });
        if (p) providerId = p._id;
      }
      if (!providerId) { console.warn('Skipping item with no providerId or providerName:', it); continue; }
      const q = { providerId, address: (it.address||'').toLowerCase(), chain: (it.chain||'ethereum').toLowerCase() };
      const existing = await ProviderWallet.findOne(q);
      if (existing){ existing.note = it.note || existing.note; existing.source = it.source || existing.source; await existing.save(); updated++; }
      else { await ProviderWallet.create({ ...q, note: it.note, source: it.source }); inserted++; }
    }catch(e: unknown){
      const msg = e && typeof e === 'object' && 'message' in e ? (e as { message?: string }).message : String(e);
      console.warn('Error importing item', it, msg);
    }
  }
  return { inserted, updated };
}

export default importItems;
