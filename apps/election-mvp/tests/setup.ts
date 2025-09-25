import { vi, beforeEach } from 'vitest'

// Mock de la base Turso pour tests isolés
vi.mock('~/server/db', () => ({
  db: {
    prepare: vi.fn(),
    run: vi.fn(),
    all: vi.fn(),
    get: vi.fn()
  }
}))

// Mock des APIs externes
vi.mock('~/server/utils/turso', () => ({
  getTursoClient: vi.fn(() => ({
    execute: vi.fn(),
    batch: vi.fn(),
    close: vi.fn()
  }))
}))

// Mock des notifications globales pour éviter erreurs UI dans tests
vi.mock('~/composables/useNotifications', () => ({
  globalNotifications: {
    crudSuccess: {
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn()
    },
    crudError: {
      validation: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn()
    }
  }
}))

// Helper pour réinitialiser DB entre tests
export const resetTestDatabase = async () => {
  // Réinitialise tous les mocks
  vi.clearAllMocks()
  
  // Turso cleanup handled by mocks for testing
  console.log('🧹 Base de test réinitialisée')
}

// Helper pour créer données de test
export const createTestData = {
  bundle: (overrides = {}) => ({
    id: 'test-bundle-' + Date.now(),
    name: 'Bundle Test',
    description: 'Description test',
    targetAudience: 'local',
    budgetRange: 'starter',
    products: [],
    estimatedTotal: 100,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  })
}

// Configuration globale pour tous les tests
beforeEach(async () => {
  await resetTestDatabase()
})
