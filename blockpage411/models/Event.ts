import { Schema, models, model, Document, Types } from 'mongoose';

export interface EventDocument extends Document {
  title: string;
  description: string;
  goalAmount: number;
  deadline: Date;
  recipientWallet: string;
  creatorUserId: Types.ObjectId;
  givingBlockCharityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<EventDocument>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  deadline: { type: Date, required: true },
  recipientWallet: { type: String, required: true },
  creatorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  givingBlockCharityId: { type: String },
}, { timestamps: true });

EventSchema.index({ creatorUserId: 1, deadline: 1 });

export default models.Event || model<EventDocument>('Event', EventSchema);
