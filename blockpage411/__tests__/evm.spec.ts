import { detectEvmDonation } from '../services/evm';
import * as providerModule from '../services/provider';

jest.mock('../services/provider');

// This test is a smoke test verifying function returns expected shape when provider is unavailable
describe('detectEvmDonation smoke', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns found=false for invalid tx', async () => {
    (providerModule.withProvider as jest.Mock).mockResolvedValue({ found: false });
    const res = await detectEvmDonation({ txHash: '0xinvalid', targetAddress: '0x0', chain: 'ethereum' });
    expect(res).toEqual({ found: false });
  });

  it('detects native transfer via provider', async () => {
    (providerModule.withProvider as jest.Mock).mockImplementation(async (_chain, cb) => {
      return cb({
        getTransaction: async () => ({ to: '0xabc', value: '1000000000000000000' }),
        getTransactionReceipt: async () => ({ logs: [] }),
      });
    });
    const res = await detectEvmDonation({ txHash: '0x1', targetAddress: '0xabc' });
    expect(res).toEqual({ found: true, amount: 1, tokenSymbol: 'ETH' });
  });
});
