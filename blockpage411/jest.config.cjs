module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^services/(.*)$': '<rootDir>/services/$1',
    '^pages/(.*)$': '<rootDir>/pages/$1'
  },
  moduleFileExtensions: ['ts','tsx','js','jsx','json','node'],
};
