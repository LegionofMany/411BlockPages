module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  // Some integration teardown (e.g. MongoMemoryServer) can take >1s to fully exit.
  // Bump the threshold to avoid noisy warnings while still surfacing real hangs.
  openHandlesTimeout: 5000,
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/lib/$1',
  '^models/(.*)$': '<rootDir>/models/$1',
    '^services/(.*)$': '<rootDir>/services/$1',
    '^\.\./\.\./services/(.*)$': '<rootDir>/services/$1',
  '^\.\./\.\./pages/(.*)$': '<rootDir>/pages/$1',
    '^pages/(.*)$': '<rootDir>/pages/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
};
