// lib/fetchTransactions.ts
// Dummy function for fetching wallet transactions. Replace with real logic.
export default async function fetchTransactions(address: string) {
  // TODO: Integrate with blockchain API
  return [
    { hash: '0x123', from: address, to: '0xabc', value: 1, timestamp: Date.now() },
    { hash: '0x456', from: '0xdef', to: address, value: 2, timestamp: Date.now() }
  ];
}
