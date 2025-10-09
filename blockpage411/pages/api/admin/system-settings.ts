/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '../../../lib/db';
import mongoose from 'mongoose';
import { withAdminAuth } from '../../../lib/adminMiddleware';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
});
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method === "GET") {
    try {
      const docs = await Settings.find({});
      const settings: Record<string, any> = {};
      docs.forEach((doc: any) => { settings[doc.key] = doc.value; });
      return res.status(200).json({ settings });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch settings', error: (err as Error).message });
    }
  }
  if (req.method === "PATCH") {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: 'Invalid settings update' });
      }
      for (const key in updates) {
        await Settings.findOneAndUpdate(
          { key },
          { value: updates[key] },
          { upsert: true, new: true }
        );
      }
      const docs = await Settings.find({});
      const settings: Record<string, any> = {};
      docs.forEach((doc: any) => { settings[doc.key] = doc.value; });
      return res.status(200).json({ settings });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to update settings', error: (err as Error).message });
    }
  }
  res.setHeader("Allow", ["GET", "PATCH"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
