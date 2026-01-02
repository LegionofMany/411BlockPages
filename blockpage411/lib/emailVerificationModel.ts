import { Schema, models, model } from 'mongoose';

const EmailVerificationSchema = new Schema({
  address: { type: String, required: true },
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export default models.EmailVerification || model('EmailVerification', EmailVerificationSchema);
