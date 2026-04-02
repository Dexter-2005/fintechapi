import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: false } }],
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;
