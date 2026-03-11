// ============================================
// Jest Configuration
// ============================================

export default {
  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  testMatchPatterns: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/main.{ts,tsx}',
    '!src/vite-env.{ts,tsx}',
    '!src/**/__tests__/**',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/store/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/components/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^zustand': '<rootDir>/node_modules/zustand',
    '^@testing-library/react$': '<rootDir>/node_modules/@testing-library/react',
    '^@testing-library/jest-dom$': '<rootDir>/node_modules/@testing-library/jest-dom',
    '^@testing-library/user-event$': '<rootDir>/node_modules/@testing-library/user-event',
  },

  transform: {
    '^.+\\.(ts|tsx)$': [
      '@swc/jest',
      {
        sourceMaps: true,
        inlineContent: true,
      },
    ],
  },

  // Global setup and teardown
  globalSetup: '<rootDir>/src/test/global-setup.ts',
  globalTeardown: '<rootDir>/src/test/global-teardown.ts',

  // Test timeout
  testTimeout: 10000,

  // Module paths
  moduleDirectories: ['node_modules'],

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'json',
    'json-summary',
    'html',
    'lcov',
  ],

  // Verbose output
  verbose: false,

  // Test results
  bail: false,
  maxWorkers: '50%',
  testLocationInResults: false,

  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Clear mocks
  clearMocks: true,
  resetMocks: true,
  resetModules: false,

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    customExportProperties: {
      'window': {
        type: 'object',
      },
    },
  },
};
