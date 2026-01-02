import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address?: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const token = req.cookies?.token;
  if (!token) {
    res.status(200).json({ authenticated: false });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const address = typeof payload === 'object' && payload ? payload.address : undefined;
    res.status(200).json({ authenticated: true, address });
  } catch {
    res.status(200).json({ authenticated: false });
  }
}
