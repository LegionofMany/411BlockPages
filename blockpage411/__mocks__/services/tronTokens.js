// Manual Jest mock for services/tronTokens
const detectTronTokenTransfer = jest.fn(async (address, txHash) => ({ found: false }));

module.exports = { detectTronTokenTransfer };
