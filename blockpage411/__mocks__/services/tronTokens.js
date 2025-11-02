// Manual Jest mock for services/tronTokens
const detectTronTokenTransfer = jest.fn(async () => ({ found: false }));

module.exports = { detectTronTokenTransfer };
