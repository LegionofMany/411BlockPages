// Manual Jest mock for services/solana
const detectSolanaTokenTransfer = jest.fn(async (address, txHash) => ({ found: false }));

module.exports = { detectSolanaTokenTransfer };
