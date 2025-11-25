// Shim for '@metamask/sdk'
module.exports = function DummyMetaMask() {
  return {
    connect: async () => null,
  };
};
