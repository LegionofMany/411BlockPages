import mongoose from 'mongoose';
import Pledge from '../models/Pledge';
import Fundraiser from '../models/Fundraiser';

export async function createPledgeAtomic(opts: {
  fundraiserId: string;
  externalId: string;
  amount: number;
  currency: string;
  donor?: string | null;
  raw?: Record<string, unknown>;
}) {
  const { fundraiserId, externalId, amount, currency, donor, raw } = opts;
  const session = await mongoose.startSession();
  try {
    let pledge: unknown = null;
    await session.withTransaction(async () => {
      // check existing
      const existing = await Pledge.findOne({ fundraiserId, externalId }).session(session).lean();
      if (existing) {
        pledge = existing;
        return;
      }
      // compute tax based on fundraiser-specific rate or default
      const DEFAULT_TAX = Number(process.env.DEFAULT_TAX_RATE ?? '0');
      let taxRate = DEFAULT_TAX;
      try {
        const pf = await Fundraiser.findOne({ id: fundraiserId }).session(session);
        if (pf && typeof (pf as Record<string, unknown>).taxRate === 'number') {
          taxRate = (pf as Record<string, unknown>).taxRate as number;
        }
      } catch {
        // ignore and use DEFAULT_TAX
      }
      const amt = Number(amount);
      const taxAmount = Math.max(0, Number((amt * Number(taxRate)).toFixed(8)));

      const created = await Pledge.create([{ fundraiserId, externalId, amount: amt, taxAmount, currency, donor: donor ?? null, status: 'completed', raw }], { session });
      // create returns an array when using create with array
      pledge = Array.isArray(created) ? created[0] : created;

      // If fundraiser currency matches, atomically increment raised and push recent donor
      const f = await Fundraiser.findOne({ id: fundraiserId }).session(session);
        if (f) {
        if ((String(f.currency || '').toUpperCase() || '') === String(currency).toUpperCase()) {
          await Fundraiser.updateOne({ id: fundraiserId }, { $inc: { raised: Number(amount), taxCollected: taxAmount }, $push: { recentDonors: { $each: [String(donor ? `${donor}:${amount}` : `Anonymous:${amount}`)], $slice: -10 } } }).session(session);
        }
      }
    });
    return pledge;
  } finally {
    session.endSession();
  }
}

export default createPledgeAtomic;
