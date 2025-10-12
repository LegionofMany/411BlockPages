import axios from 'axios';
import { detectSolanaTokenTransfer } from '../services/solana';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('detectSolanaTokenTransfer', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns found=false when no transfers', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tokenTransfers: [] } });
    const res = await detectSolanaTokenTransfer('SomeAddr', 'tx123');
    expect(res).toEqual({ found: false });
  });

  it('detects transfer from solscan response', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tokenTransfers: [{ to: 'addr1', amount: '100', tokenSymbol: 'USDC' }] } });
    const res = await detectSolanaTokenTransfer('addr1', 'tx123');
    expect(res).toEqual({ found: true, amount: 100, token: 'USDC' });
  });

  it('falls back to solana.fm when solscan fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('solscan fail'));
    mockedAxios.get.mockResolvedValueOnce({ data: { result: { tokenTransfers: [{ to: 'addr2', uiAmount: 50, symbol: 'SOL' }] } } });
    const res = await detectSolanaTokenTransfer('addr2', 'tx123');
    expect(res).toEqual({ found: true, amount: 50, token: 'SOL' });
  });
});
