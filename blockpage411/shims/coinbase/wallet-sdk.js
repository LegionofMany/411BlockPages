// Shim for '@coinbase/wallet-sdk'
module.exports = function DummyCoinbaseWallet() {
  return {
    connect: async () => null,
  };
};
