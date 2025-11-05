/**
 * Endpoint Diagnostic: Liste toutes les clés Redis et teste invalidation
 *
 * Utilisé pour identifier le problème de préfixe de clé:
 * - Quelle est la clé EXACTE stockée dans Redis?
 * - Est-ce "products:list:active" ou "cache:products:list:active"?
 * - Y a-t-il un préfixe supplémentaire inattendu?
 *
 * Crédit: Diagnostic Gemini Copilot (2025-11-05)
 */

export default defineEventHandler(async (event) => {
  const cacheStorage = useStorage('cache')

  try {
    // 1. Lister toutes les clés dans le storage 'cache'
    const allKeys = await cacheStorage.getKeys()
    console.log(`🔍 [DEBUG REDIS] Clés trouvées dans storage 'cache':`, allKeys)

    // 2. Informations détaillées sur chaque clé
    const keysDetails = []
    for (const key of allKeys) {
      const value = await cacheStorage.getItem(key)
      keysDetails.push({
        key,
        hasValue: !!value,
        valueType: Array.isArray(value) ? 'array' : typeof value,
        length: Array.isArray(value) ? value.length : undefined
      })
    }

    // 3. Test de création/suppression pour diagnostiquer le préfixe
    const testKey = 'test:diagnostic:timestamp'
    const testValue = { timestamp: Date.now(), test: true }

    console.log(`🧪 [DEBUG REDIS] Test setItem avec clé: "${testKey}"`)
    await cacheStorage.setItem(testKey, testValue, { ttl: 60 })

    console.log(`🧪 [DEBUG REDIS] Test getItem avec clé: "${testKey}"`)
    const retrieved = await cacheStorage.getItem(testKey)

    console.log(`🧪 [DEBUG REDIS] Test removeItem avec clé: "${testKey}"`)
    await cacheStorage.removeItem(testKey)

    console.log(`🧪 [DEBUG REDIS] Vérification après removeItem`)
    const afterRemove = await cacheStorage.getItem(testKey)

    // 4. Test spécifique pour products:list:active
    const productsCacheKey = 'products:list:active'
    const productsCache = await cacheStorage.getItem(productsCacheKey)

    return {
      success: true,
      timestamp: new Date().toISOString(),
      storage: {
        name: 'cache',
        totalKeys: allKeys.length,
        keys: allKeys,
        details: keysDetails
      },
      test: {
        key: testKey,
        setItemSuccess: true,
        getItemSuccess: !!retrieved,
        removeItemSuccess: !afterRemove,
        retrievedValue: retrieved,
        afterRemoveValue: afterRemove
      },
      productsCache: {
        key: productsCacheKey,
        exists: !!productsCache,
        length: Array.isArray(productsCache) ? productsCache.length : undefined
      },
      diagnosis: {
        removeItemWorks: !afterRemove,
        message: !afterRemove
          ? '✅ removeItem fonctionne correctement'
          : `❌ removeItem NE FONCTIONNE PAS - Clé présente après suppression!`
      }
    }

  } catch (error) {
    console.error('❌ [DEBUG REDIS] Erreur diagnostic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }
  }
})
