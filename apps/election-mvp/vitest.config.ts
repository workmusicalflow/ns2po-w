import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    setupFiles: ['./tests/setup.ts'],
    // Tests parallèles pour rapidité
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Évite conflicts DB
      }
    },
    // Configuration couverture
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/tests/**',
        '**/*.d.ts',
        '.nuxt/**',
        'public/**'
      ],
      // Focus sur Core 20% - tests d'intégration API et logique métier
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    // Timeout adapté aux tests d'intégration avec DB
    testTimeout: 10000,
    // Répétitions pour détecter flakiness
    retry: 1,
    // Cleanup entre tests
    restoreMocks: true,
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true
  },
})
