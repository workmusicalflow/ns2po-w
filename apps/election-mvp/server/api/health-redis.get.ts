/**
 * API Route: GET /api/health-redis
 * Endpoint de diagnostic pour vérifier la connexion Redis
 *
 * Retourne:
 * - redis: 'connected' si Redis répond
 * - redis: 'memory-fallback' si pas de REDIS_URL (dev local)
 * - redis: 'error' si Redis configuré mais inaccessible
 */

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const redisUrl = process.env.REDIS_URL

    // Si pas de REDIS_URL, utilise memory driver (comportement normal dev local)
    if (!redisUrl) {
      return {
        redis: 'memory-fallback',
        driver: 'memory',
        message: 'REDIS_URL non configuré, utilise cache mémoire (normal en dev local)',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }

    // Tester connexion Redis avec write/read/delete
    const cache = useStorage('cache')
    const testKey = `health:redis:test:${Date.now()}`
    const testValue = { timestamp: new Date().toISOString(), random: Math.random() }

    // Write test
    await cache.setItem(testKey, testValue, { ttl: 10 })

    // Read test
    const readValue = await cache.getItem(testKey)

    // Delete test
    await cache.removeItem(testKey)

    // Vérifier que la valeur lue correspond
    const isValid = readValue &&
                   typeof readValue === 'object' &&
                   'timestamp' in readValue &&
                   'random' in readValue

    if (!isValid) {
      throw new Error('Redis read/write test failed: values mismatch')
    }

    return {
      redis: 'connected',
      driver: 'redis',
      redisUrl: redisUrl.replace(/:[^:@]+@/, ':****@'), // Masquer password dans logs
      testKey,
      testPassed: true,
      operations: {
        setItem: 'ok',
        getItem: 'ok',
        removeItem: 'ok'
      },
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ [HEALTH REDIS] Erreur connexion Redis:', error)

    return {
      redis: 'error',
      driver: process.env.REDIS_URL ? 'redis' : 'memory',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      redisUrl: process.env.REDIS_URL
        ? process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@')
        : undefined,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
})
