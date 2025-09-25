import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup-basic.ts'],
    // Tests parallèles pour rapidité
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Évite conflicts DB
      }
    },
    // Configuration globales pour mocks
    globals: true,
    // Timeout adapté aux tests d'intégration avec DB
    testTimeout: 10000,
    // Répétitions pour détecter flakiness
    retry: 1,
    // Cleanup entre tests
    restoreMocks: true,
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // Include patterns pour tests d'intégration
    include: ['tests/integration/**/*.test.ts'],
    // Mock des modules externes
    alias: {
      '~/server/utils/database': './tests/mocks/database.ts',
      '~/schemas/bundle': './schemas/bundle.ts',
      'h3': './tests/mocks/h3.ts'
    }
  },
})