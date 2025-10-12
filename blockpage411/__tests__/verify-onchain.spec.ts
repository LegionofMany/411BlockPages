import handler from '../../pages/api/fundraisers/verify-onchain';
import * as evm from '../../services/evm';
import * as sol from '../../services/solana';
import * as tron from '../../services/tronTokens';

// Mock minimal req/res
function makeReq(body: any) {
  return { method: 'POST', body } as any;
}
function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (obj: any) => { res._json = obj; return res; };
  return res;
}

jest.mock('../../services/evm');
jest.mock('../../services/solana');
jest.mock('../../services/tronTokens');

describe('verify-onchain API', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns 400 for missing fields', async () => {
    const req = makeReq({});
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('accepts evm native donation', async () => {
    (evm.detectEvmDonation as jest.Mock).mockResolvedValue({ found: true, amount: 2, tokenSymbol: 'ETH' });
    const req = makeReq({ fundraiserId: 'f1', chain: 'ethereum', txHash: '0x1', targetAddress: '0xabc' });
    const res = makeRes();
    await handler(req, res);
    // handler currently attempts DB operations; we at least expect a 200/202 or similar
    expect([200,201,202]).toContain(res._status);
  });
});
