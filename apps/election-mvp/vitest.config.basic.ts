import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup-basic.ts'],
    testTimeout: 5000,
    globals: true
  },
})
