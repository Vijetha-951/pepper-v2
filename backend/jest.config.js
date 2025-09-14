export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: false,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleFileExtensions: ['js', 'json']
};