import type { NextApiRequest, NextApiResponse } from "next";
import { calculateRiskScore } from "../../../services/risk/calculateRiskScore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { chain, address } = req.query;
  if (!chain || typeof chain !== "string" || !address || typeof address !== "string") {
    return res.status(400).json({ message: "chain and address are required" });
  }

  try {
    const result = await calculateRiskScore({ chain, address });
    return res.status(200).json(result);
  } catch (err) {
    console.error("/api/wallet/risk error", err);
    return res.status(500).json({ message: "Failed to calculate risk" });
  }
}
