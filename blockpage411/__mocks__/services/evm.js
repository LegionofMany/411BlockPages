// Manual Jest mock for services/evm
const detectEvmDonation = jest.fn(async () => {
  // Default mock returns not found; tests can override with jest.mockResolvedValue
  return { found: false };
});

module.exports = { detectEvmDonation };
