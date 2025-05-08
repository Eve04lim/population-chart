// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリをセット
  dir: './',
});

// Jestのカスタム設定
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // aliasの設定（tsconfig.jsonのpathsと合わせる）
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testTimeout: 30000, // テストのタイムアウトを30秒に設定
  verbose: true, // 詳細なテスト結果を表示
  maxWorkers: '50%', // テスト実行に使用するCPUの割合を制限
  globals: {
    'ts-jest': {
      isolatedModules: true, // 各テストファイルを独立して実行
    },
  },
};

// createJestConfigを定義することによって、本ファイルで定義された設定がNext.jsの設定に反映される
export default createJestConfig(customJestConfig);