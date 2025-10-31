// Jest setup: provide lightweight mocks for global modules used in tests
// Keep this synchronous to ensure Jest applies mocks before tests run.
try {
  // No-op DB connector for tests
  jest.doMock('lib/db', () => ({ __esModule: true, default: async () => ({}) }));
} catch (e) {
  // jest not available in non-test contexts
}

try {
  // Mock axios to prevent external HTTP calls from API handlers during tests
  jest.doMock('axios', () => ({ __esModule: true, default: { post: jest.fn().mockResolvedValue({}), get: jest.fn().mockResolvedValue({}) }, post: jest.fn().mockResolvedValue({}), get: jest.fn().mockResolvedValue({}) }));
} catch (e) {}

// Provide a global fetch mock to avoid network calls in tests that use fetch
try {
  // @ts-expect-error allow assigning mock to global.fetch in test env
  global.fetch = global.fetch || jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
} catch (e) {}

try {
  // Mock pledge service to avoid mongoose transactions in tests
  jest.doMock('lib/pledgeService', () => ({ __esModule: true, createPledgeAtomic: async (opts) => ({ id: 'mockpledge', ...opts }), default: async (opts) => ({ id: 'mockpledge', ...opts }) }));
} catch (e) {}

try {
  // Mock models used by handlers to avoid DB access in unit tests
  jest.doMock('models/Fundraiser', () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => ({ id: 'f1', walletAddress: '0xabc', active: true, status: 'approved', currency: 'ETH' }) }) } }));
} catch (e) {}

try {
  jest.doMock('models/Pledge', () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => null }), create: jest.fn() } }));
} catch (e) {}

// Also attempt to mock by absolute path (helps when modules are imported via relative paths)
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path');
  const fundPath = path.join(process.cwd(), 'models', 'Fundraiser');
  try { jest.doMock(fundPath, () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => ({ id: 'f1', walletAddress: '0xabc', active: true, status: 'approved', currency: 'ETH' }) }) } })); } catch (e) {}
  const pledgePath = path.join(process.cwd(), 'models', 'Pledge');
  try { jest.doMock(pledgePath, () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => null }), create: jest.fn() } })); } catch (e) {}
} catch (e) {}

// Mock common fetch libraries (undici/node-fetch) to prevent network calls
try { jest.doMock('undici', () => ({ fetch: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) })); } catch (e) {}
try { jest.doMock('node-fetch', () => ({ __esModule: true, default: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) })); } catch (e) {}

