import axios from 'axios';
import { detectTronTokenTransfer } from '../services/tronTokens';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('detectTronTokenTransfer', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns found=false when not found', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    const res = await detectTronTokenTransfer('TADDR', 'tx1');
    expect(res).toEqual({ found: false });
  });

  it('detects TRC-20 transfer from tronscan', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { tokenTransfers: [{ to: 'T1', value: '10', tokenName: 'TRX_TOKEN' }] } });
    const res = await detectTronTokenTransfer('T1', 'tx1');
    expect(res).toEqual({ found: true, amount: 10, token: 'TRX_TOKEN' });
  });
});
