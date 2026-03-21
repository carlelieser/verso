module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.ts',
        '<rootDir>/tests/unit/**/*.test.tsx',
      ],
      transform: {
        '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-typescript'] }],
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.ts',
      ],
      transform: {
        '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-typescript'] }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(drizzle-orm)/)',
      ],
    },
  ],
};
