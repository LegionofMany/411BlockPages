// Jest setup: provide lightweight mocks for global modules used in tests
// Keep this synchronous to ensure Jest applies mocks before tests run.
try {
  // No-op DB connector for tests
  jest.doMock('lib/db', () => ({ __esModule: true, default: async () => ({}) }));
} catch {
  // jest not available in non-test contexts
}

try {
  // Mock axios to prevent external HTTP calls from API handlers during tests
  jest.doMock('axios', () => ({ __esModule: true, default: { post: jest.fn().mockResolvedValue({}), get: jest.fn().mockResolvedValue({}) }, post: jest.fn().mockResolvedValue({}), get: jest.fn().mockResolvedValue({}) }));
} catch {}

// Provide lightweight in-memory mocks for provider and provider-wallet models used by the importer tests
try {
  jest.doMock('lib/providerModel', () => {
    const providers = [ { _id: 'prov-binance', name: 'Binance', aliases: ['Binance','binance'] } ];
    const model = {
      find: jest.fn().mockResolvedValue(providers),
      findOne: jest.fn().mockImplementation(async (q) => {
        if (!q) return null;
        if (q.name) return providers.find(p => String(p.name) === String(q.name)) || null;
        if (q.aliases) return providers.find(p => (p.aliases || []).includes(q.aliases)) || null;
        return null;
      }),
      findById: jest.fn().mockImplementation(async (id) => providers.find(p => String(p._id) === String(id)) || null),
    };
    return { __esModule: true, default: model };
  });
} catch {}

try {
  jest.doMock('lib/providerWalletModel', () => {
    const wallets = [];
    // expose for test cleanup
    try { global.__TEST_WALLETS = wallets; } catch (e) {}
    const model = {
      findOne: jest.fn().mockImplementation(async (filter) => wallets.find(w => w.providerId === filter.providerId && w.address === filter.address && w.chain === filter.chain) || null),
      updateOne: jest.fn().mockImplementation(async (filter, update) => {
        const w = wallets.find(w => w.providerId === (filter.providerId) && w.address === (filter.address) && w.chain === (filter.chain));
        if (w) { if (update.$set) Object.assign(w, update.$set); return { modifiedCount: 1 }; }
        return { modifiedCount: 0 };
      }),
      create: jest.fn().mockImplementation(async (doc) => { wallets.push(Object.assign({}, doc)); return doc; }),
      bulkWrite: jest.fn().mockImplementation(async (ops) => {
        let upserts = 0, modified = 0;
        for (const o of ops){
          const filter = o.updateOne.filter;
          const update = o.updateOne.update;
          const existing = wallets.find(w => w.providerId === filter.providerId && w.address === filter.address && w.chain === filter.chain);
          if (existing){ if (update.$set) Object.assign(existing, update.$set); modified++; }
          else { const doc = Object.assign({}, filter, update.$setOnInsert || {}, update.$set || {}); wallets.push(doc); upserts++; }
        }
        return { upsertedCount: upserts, modifiedCount: modified };
      }),
    };
    return { __esModule: true, default: model };
  });
} catch {}

// Provide a global fetch mock to avoid network calls in tests that use fetch
try {
  // @ts-expect-error allow assigning mock to global.fetch in test env
  global.fetch = global.fetch || jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
} catch {}

try {
  // Mock pledge service to avoid mongoose transactions in tests
  jest.doMock('lib/pledgeService', () => ({ __esModule: true, createPledgeAtomic: async (opts) => ({ id: 'mockpledge', ...opts }), default: async (opts) => ({ id: 'mockpledge', ...opts }) }));
} catch {}

try {
  // Mock models used by handlers to avoid DB access in unit tests
  jest.doMock('models/Fundraiser', () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => ({ id: 'f1', walletAddress: '0xabc', active: true, status: 'approved', currency: 'ETH' }) }) } }));
} catch {}

try {
  jest.doMock('models/Pledge', () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => null }), create: jest.fn() } }));
} catch {}

// Also attempt to mock by absolute path (helps when modules are imported via relative paths)
try {
  // use dynamic import to avoid require() rule in lint
  import('path').then((path) => {
    try {
      const fundPath = path.join(process.cwd(), 'models', 'Fundraiser');
      try { jest.doMock(fundPath, () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => ({ id: 'f1', walletAddress: '0xabc', active: true, status: 'approved', currency: 'ETH' }) }) } })); } catch {}
      const pledgePath = path.join(process.cwd(), 'models', 'Pledge');
      try { jest.doMock(pledgePath, () => ({ __esModule: true, default: { findOne: jest.fn().mockReturnValue({ lean: async () => null }), create: jest.fn() } })); } catch {}
    } catch {}
  }).catch(()=>{});
} catch {}

// Mock common fetch libraries (undici/node-fetch) to prevent network calls
try { jest.doMock('undici', () => ({ fetch: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) })); } catch {}
try { jest.doMock('node-fetch', () => ({ __esModule: true, default: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) })); } catch {}

// Attempt to clean up common open handles after tests finish to avoid Jest hanging
try {
  if (typeof afterAll === 'function') {
    afterAll(async () => {
      try {
        // disconnect mongoose if present (dynamic import)
        try {
          const mm = await import('mongoose').catch(()=>null);
          const mongoose = mm ? (mm.default ?? mm) : null;
          if (mongoose && typeof mongoose.disconnect === 'function') {
            await mongoose.disconnect();
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
      try {
        // clear any timers left running
        // @ts-expect-error setImmediate may not be present
        if (typeof clearImmediate === 'function') clearImmediate();
      } catch {}
    });
  }
} catch {}

// Ensure mocks and timers are cleaned between tests to avoid open handles
try {
  if (typeof afterEach === 'function') {
    afterEach(() => {
      try { jest.clearAllTimers(); } catch (e) {}
      try { jest.useRealTimers(); } catch (e) {}
      try { jest.clearAllMocks(); } catch (e) {}
      try { jest.restoreAllMocks(); } catch (e) {}
      // reset global.fetch mock if present
      try {
  // @ts-expect-error global.fetch may be mocked and have different runtime shape
        if (global.fetch && global.fetch.mockClear) global.fetch.mockClear();
      } catch (e) {}
      // clear in-memory test wallets if present
      try {
        const g = global;
        const w = g.__TEST_WALLETS;
        if (Array.isArray(w)) w.length = 0;
      } catch (e) {}
    });
  }
} catch {}

