import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/core/vitest.config.ts',
  'packages/edifact/vitest.config.ts',
  'packages/x12/vitest.config.ts',
  'packages/infrastructure-shared/vitest.config.ts',
]);
