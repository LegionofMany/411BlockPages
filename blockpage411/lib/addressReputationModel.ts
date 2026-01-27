import { Schema, models, model } from 'mongoose';

const AddressReputationSchema = new Schema(
  {
    chain: { type: String, required: true, index: true },
    address: { type: String, required: true, index: true },

    // Transaction ratings (only for txs sent from this address)
    txRatingAvg: { type: Number, default: 0 },
    txRatingCount: { type: Number, default: 0 },

    // Exchange / provider interactions summary (best-effort)
    topInteractions: {
      type: [
        {
          name: String,
          type: String,
          count: Number,
        },
      ],
      default: [],
    },

    // 0..100 where higher is better
    reputationScore: { type: Number, default: 0 },
    reputationLabel: { type: String, default: 'Unknown' },

    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

AddressReputationSchema.index({ chain: 1, address: 1 }, { unique: true });

export default models.AddressReputation || model('AddressReputation', AddressReputationSchema);
