import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

function makeReq(opts: Partial<NextApiRequest>): NextApiRequest {
  return opts as NextApiRequest;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (obj: any) => { res._json = obj; return res; };
  res.setHeader = () => res;
  return res as NextApiResponse;
}

describe('integration: /api/profile/update', () => {
  jest.setTimeout(30_000);
  let mongod: MongoMemoryServer;
  let handler: any;
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = 'integration-secret';
    // Import after env var is set so lib/db picks up MONGODB_URI
    handler = (await import('../pages/api/profile/update')).default;
    // connect mongoose for test-side checks
    await mongoose.connect(process.env.MONGODB_URI!);
  });
  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  it('mirrors updates to wallet.socials', async () => {
    const Wallet = (await import('../lib/walletModel')).default;
    const User = (await import('../lib/userModel')).default;
    const walletAddress = '0xint123';
    // create a wallet document that should be mirrored
    await Wallet.create({ address: walletAddress, chain: 'eth' });
    // create a minimal user document so handler updates existing user instead of creating
    await User.create({ address: walletAddress, nonce: 'seed', nonceCreatedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });

    const token = jwt.sign({ address: walletAddress }, process.env.JWT_SECRET as string);
    const req = makeReq({ method: 'PUT', cookies: { token } as any, body: { walletAddress, displayName: 'IntegrationName', avatarUrl: 'https://example.com/a.png' } });
    const res = makeRes();
    await handler(req, res);
    expect((res as any)._status).toBe(200);
    const updated = await Wallet.findOne({ address: walletAddress }).lean();
    console.log('INTEGRATION: wallet updated doc ->', JSON.stringify(updated));
    expect(updated).not.toBeNull();
    // expect socials were set
    // `socials` may be undefined or an object depending on the model; verify fields
    expect((updated as any).socials).toBeDefined();
    expect((updated as any).socials.displayName).toBe('IntegrationName');
    expect((updated as any).socials.avatarUrl).toBe('https://example.com/a.png');
  });
});
