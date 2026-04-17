module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
  },
  collectCoverageFrom: [
    'src/modules/**/*.resolver.ts',
    'src/modules/**/*.service.ts',
    'src/shared/errors/AppError.ts',
    'src/shared/utils/jwt.ts',
    'src/shared/utils/password.ts',
    'src/shared/utils/pagination.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/index.ts',
    '<rootDir>/src/app.ts',
    '<rootDir>/src/demo.ts',
    '<rootDir>/src/server.ts',
    '<rootDir>/src/config/',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
