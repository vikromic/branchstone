/**
 * Jest Configuration
 * Configured for ES modules and DOM testing
 */

export default {
  // Use jsdom environment for DOM testing
  testEnvironment: 'jsdom',

  // Setup files after environment
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'docs/js/**/*.js',
    '!docs/js/**/*.min.js',
    '!docs/js/artworks.json',
    '!docs/js/translations.json',
  ],

  coverageThreshold: {
    global: {
      branches: 30,
      functions: 35,
      lines: 35,
      statements: 35
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Module paths
  moduleDirectories: ['node_modules', 'docs/js'],

  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/docs/js/vendor/'
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Max workers for parallel execution
  maxWorkers: '50%',
};
