import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'packages/core/src/**/*.ts',
        'packages/edifact/src/**/*.ts',
        'packages/x12/src/**/*.ts',
        'packages/infrastructure-shared/src/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        '**/*.d.ts',
        // Pure TypeScript interfaces (nothing to test)
        '**/ports/**/*.ts',
        '**/validation/Validator.ts',
        '**/services/JSONSchema.ts',
        '**/services/mapping/MappingRule.ts',
        // DTOs (data containers, no logic)
        '**/*DTO.ts',
        '**/*InputDTO.ts',
        '**/*OutputDTO.ts',
      ],
    },
  },
});

