/**
 * Endpoint Diagnostic: Accès DIRECT au client ioredis
 *
 * Teste si removeItem échoue à cause d'unstorage ou du driver Redis lui-même
 * Option D de Gemini: Contourner unstorage et utiliser directement ioredis
 *
 * Crédit: Diagnostic Gemini Copilot (2025-11-05)
 */

export default defineEventHandler(async (event) => {
  const cacheStorage = useStorage('cache')

  try {
    // Tentative d'accès au driver sous-jacent
    const storage = useStorage()
    const driver = storage.getMounts().find(m => m.base === 'cache')?.driver

    if (!driver) {
      return {
        success: false,
        error: 'Driver cache non trouvé',
        mounts: storage.getMounts().map(m => ({ base: m.base, driver: m.driver?.constructor?.name }))
      }
    }

    console.log(`🔍 [DEBUG DIRECT] Driver trouvé:`, driver.constructor?.name)

    // Vérifier si le driver a un client ioredis
    const hasRedisClient = 'redis' in driver
    console.log(`🔍 [DEBUG DIRECT] Driver a client ioredis:`, hasRedisClient)

    if (!hasRedisClient) {
      return {
        success: false,
        error: 'Driver ne possède pas de client ioredis',
        driverType: driver.constructor?.name,
        driverKeys: Object.keys(driver)
      }
    }

    // Test avec client ioredis direct
    const redis = (driver as any).redis
    const testKey = 'cache:test:direct:timestamp'
    const testValue = JSON.stringify({ timestamp: Date.now(), method: 'direct-ioredis' })

    // Test SET
    console.log(`🧪 [DEBUG DIRECT] Redis SET "${testKey}"`)
    await redis.set(testKey, testValue, 'EX', 60)

    // Test GET
    console.log(`🧪 [DEBUG DIRECT] Redis GET "${testKey}"`)
    const retrieved = await redis.get(testKey)

    // Test DEL
    console.log(`🧪 [DEBUG DIRECT] Redis DEL "${testKey}"`)
    const deleted = await redis.del(testKey)

    // Vérification après DEL
    console.log(`🧪 [DEBUG DIRECT] Vérification après DEL`)
    const afterDelete = await redis.get(testKey)

    // Lister TOUTES les clés Redis (attention: peut être lent si beaucoup de clés)
    console.log(`🔍 [DEBUG DIRECT] Redis KEYS cache:*`)
    const allCacheKeys = await redis.keys('cache:*')

    // Test sur clé products réelle
    const productsCacheKey = 'cache:products:list:active'
    console.log(`🔍 [DEBUG DIRECT] Redis GET "${productsCacheKey}"`)
    const productsExists = await redis.exists(productsCacheKey)
    const productsTTL = productsExists ? await redis.ttl(productsCacheKey) : null

    return {
      success: true,
      timestamp: new Date().toISOString(),
      driver: {
        name: driver.constructor?.name,
        hasRedisClient: true
      },
      directTest: {
        key: testKey,
        setSuccess: true,
        getSuccess: !!retrieved,
        retrievedValue: retrieved,
        deleteCount: deleted,
        afterDeleteValue: afterDelete,
        deleteWorks: deleted === 1 && !afterDelete
      },
      allCacheKeys: {
        count: allCacheKeys.length,
        keys: allCacheKeys,
        sample: allCacheKeys.slice(0, 10)
      },
      productsCache: {
        key: productsCacheKey,
        exists: productsExists === 1,
        ttl: productsTTL
      },
      diagnosis: {
        directDeleteWorks: deleted === 1 && !afterDelete,
        message: deleted === 1 && !afterDelete
          ? '✅ Suppression directe ioredis fonctionne - Problème dans couche unstorage'
          : '❌ Suppression directe ioredis échoue aussi - Problème driver Redis'
      }
    }

  } catch (error) {
    console.error('❌ [DEBUG DIRECT] Erreur:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }
  }
})
