module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './anchor',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      useESM: true,
      tsconfig: './tsconfig.json'
    }],
  },
  moduleNameMapper: {
    '^@project/anchor$': '<rootDir>/src'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(spl-token-bankrun|@solana/web3.js)/.*)',
  ],
  testMatch: [
    '**/tests/**/*.spec.ts',
  ]
};