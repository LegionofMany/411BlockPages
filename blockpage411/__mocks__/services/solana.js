// Manual Jest mock for services/solana
const detectSolanaTokenTransfer = jest.fn(async () => ({ found: false }));

module.exports = { detectSolanaTokenTransfer };
