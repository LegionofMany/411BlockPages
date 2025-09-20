import { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  nonceCreatedAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default models.User || model('User', UserSchema);