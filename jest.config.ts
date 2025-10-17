import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'allure-jest/node', // ключевая строка
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  reporters: ['default'],
  setupFiles: ['<rootDir>/tests/setup.env.ts'],
};

export default config;
