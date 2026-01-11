module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/lib/$1',
  '^models/(.*)$': '<rootDir>/models/$1',
    '^services/(.*)$': '<rootDir>/services/$1',
    '^\.\./\.\./services/(.*)$': '<rootDir>/services/$1',
  '^\.\./\.\./pages/(.*)$': '<rootDir>/pages/$1',
    '^pages/(.*)$': '<rootDir>/pages/$1'
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
};
