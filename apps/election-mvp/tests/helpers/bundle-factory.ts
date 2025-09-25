import { faker } from '@faker-js/faker'

// Types Bundle basés sur l'interface existante
export interface Bundle {
  id: string
  name: string
  description: string
  targetAudience: 'local' | 'regional' | 'national' | 'universal'
  budgetRange: 'starter' | 'medium' | 'premium' | 'enterprise'
  products: any[]
  estimatedTotal: number
  originalTotal?: number
  savings?: number
  popularity: number
  isActive: boolean
  isFeatured?: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export const BundleFactory = {
  create: (overrides: Partial<Bundle> = {}): Bundle => {
    const targetAudiences: Bundle['targetAudience'][] = ['local', 'regional', 'national', 'universal']
    const budgetRanges: Bundle['budgetRange'][] = ['starter', 'medium', 'premium', 'enterprise']
    
    const estimatedTotal = faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
    const originalTotal = estimatedTotal * faker.number.float({ min: 1.1, max: 1.5, fractionDigits: 2 })
    
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      targetAudience: faker.helpers.arrayElement(targetAudiences),
      budgetRange: faker.helpers.arrayElement(budgetRanges),
      products: [],
      estimatedTotal,
      originalTotal,
      savings: originalTotal - estimatedTotal,
      popularity: faker.number.int({ min: 0, max: 10 }),
      isActive: faker.datatype.boolean({ probability: 0.8 }), // 80% actifs
      isFeatured: faker.datatype.boolean({ probability: 0.2 }), // 20% featured
      tags: faker.helpers.arrayElements([
        'électoral', 'campagne', 'gadgets', 'personnalisé', 'urgent', 'populaire'
      ], { min: 1, max: 3 }),
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  },
  
  createMany: (count = 5, overrides: Partial<Bundle> = {}): Bundle[] =>
    Array.from({ length: count }, () => BundleFactory.create(overrides)),
    
  // Factories spécialisées pour différents scénarios de test
  createActive: (overrides: Partial<Bundle> = {}): Bundle =>
    BundleFactory.create({ isActive: true, ...overrides }),
    
  createInactive: (overrides: Partial<Bundle> = {}): Bundle =>
    BundleFactory.create({ isActive: false, ...overrides }),
    
  createFeatured: (overrides: Partial<Bundle> = {}): Bundle =>
    BundleFactory.create({ isFeatured: true, isActive: true, ...overrides }),
    
  createByAudience: (audience: Bundle['targetAudience'], overrides: Partial<Bundle> = {}): Bundle =>
    BundleFactory.create({ targetAudience: audience, ...overrides }),
    
  createByBudget: (budget: Bundle['budgetRange'], overrides: Partial<Bundle> = {}): Bundle =>
    BundleFactory.create({ budgetRange: budget, ...overrides }),
    
  // Factory pour tests de performance avec dataset volumineux
  createLargeDataset: (count = 100): Bundle[] => {
    return Array.from({ length: count }, (_, index) => BundleFactory.create({
      id: `perf-test-bundle-${index}`,
      name: `Bundle Performance Test ${index + 1}`
    }))
  },
  
  // Factory pour tests d'edge cases
  createEdgeCases: (): Bundle[] => [
    // Bundle avec prix minimum
    BundleFactory.create({
      name: 'Bundle Prix Minimum',
      estimatedTotal: 0.01,
      originalTotal: 0.02,
      savings: 0.01
    }),
    // Bundle avec prix maximum
    BundleFactory.create({
      name: 'Bundle Prix Maximum',
      estimatedTotal: 99999.99,
      originalTotal: 100000.00,
      savings: 0.01
    }),
    // Bundle sans remise
    BundleFactory.create({
      name: 'Bundle Sans Remise',
      estimatedTotal: 100,
      originalTotal: 100,
      savings: 0
    }),
    // Bundle avec nom très long
    BundleFactory.create({
      name: 'Bundle avec un nom extrêmement long qui dépasse probablement les limites normales de longueur pour tester la troncature et l\'affichage',
      description: 'Description également très longue '.repeat(10)
    }),
    // Bundle avec caractères spéciaux
    BundleFactory.create({
      name: 'Bundle "Spécial" & Accentué ñ €',
      description: 'Description avec émojis 🎯📦💡 et caractères spéciaux @#$%'
    })
  ]
}

// Helper pour reset faker seed (reproductibilité des tests)
export const setTestSeed = (seed: number) => {
  faker.seed(seed)
}

// Factory pour données de produits (utilisés dans bundles)
export const ProductFactory = {
  create: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: faker.number.float({ min: 5, max: 200, fractionDigits: 2 }),
    category: faker.helpers.arrayElement(['textile', 'accessoire', 'papeterie', 'gadget']),
    ...overrides
  }),
  
  createMany: (count = 3, overrides = {}) =>
    Array.from({ length: count }, () => ProductFactory.create(overrides))
}

// Variables globales pour les tests (exports réutilisables)
export const validBundle = BundleFactory.create({
  name: 'Bundle Test Valide',
  description: 'Description valide de test pour les validations',
  targetAudience: 'local',
  budgetRange: 'medium',
  products: [
    {
      id: 'prod-valid-1',
      name: 'Produit Test Valide',
      basePrice: 10000,
      quantity: 2,
      subtotal: 20000
    }
  ]
})

export const invalidBundle = BundleFactory.create({
  name: '', // Nom vide - invalide
  description: 'Desc', // Description trop courte
  targetAudience: 'invalid_audience' as any, // Audience invalide
  budgetRange: 'invalid_range' as any, // Range invalide
  products: []
})

// Mock event pour les tests d'API
export const mockEvent = {
  node: {
    req: {},
    res: {
      setHeader: jest.fn()
    }
  }
} as any
