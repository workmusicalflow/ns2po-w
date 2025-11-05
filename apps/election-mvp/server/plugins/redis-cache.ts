/**
 * Nitro Plugin: Monte un driver Redis STRICT (pas de fallback memory)
 *
 * FIX RÉGRESSION: Supprime fallback memory silencieux qui causait:
 * - Cache invalidé localement sur instance A
 * - Mais instance B (F5) servait données stale de son memory cache local
 * - Multi-instances Railway nécessite cache distribué STRICT
 *
 * Solution: Redis OBLIGATOIRE en production, échec explicite si indisponible
 * Dev local: Utilise memory driver si REDIS_URL absent (normal)
 *
 * Crédit: Diagnostic Gemini + Solution GPT-5 (2025-11-05)
 */

import memoryDriver from 'unstorage/drivers/memory'
import redisDriverFactory from 'unstorage/drivers/redis'

const NAMESPACE = 'cache'
const GLOBAL_KEY = '__nuxt_unstorage_cache_mounted__'

function createDriverFromEnv() {
  const url = process.env.REDIS_URL

  // Production Railway: Redis OBLIGATOIRE
  if (url) {
    console.log('🔄 [REDIS PROXY] Création driver Redis (production mode)...')

    try {
      const driver = redisDriverFactory({ url, ttl: 300 })
      console.log('✅ [REDIS PROXY] Driver Redis créé avec succès')
      return driver
    } catch (e) {
      // ⚠️ PAS DE FALLBACK MEMORY! Échec explicite en production
      console.error('❌ [REDIS PROXY] ÉCHEC CRITIQUE création driver Redis:', e)
      console.error('❌ [REDIS PROXY] Cache distribué indisponible, invalidation multi-instances cassée')
      throw new Error(`Redis driver creation failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Dev local: Memory driver acceptable (pas de multi-instances)
  console.log('ℹ️ [REDIS PROXY] Pas de REDIS_URL, utilise memory driver (dev local uniquement)')
  return memoryDriver()
}

function createLazyDriver() {
  let driver: any = null
  const ensure = () => {
    if (!driver) {
      driver = createDriverFromEnv()
      console.log(
        process.env.REDIS_URL
          ? `✅ [REDIS PROXY] Driver initialisé (redis)`
          : '✅ [REDIS PROXY] Driver initialisé (memory fallback)'
      )
    }
    return driver
  }

  // Liste des méthodes habituelles d'un driver unstorage. On délègue dynamiquement.
  const methods = [
    'getItem',
    'setItem',
    'removeItem',
    'clear',
    'hasItem',
    'getKeys',
    'list',
    'entries',
    'expire',
    'ttl'
  ]

  const proxy: Record<string, any> = {}
  for (const m of methods) {
    proxy[m] = async (...args: any[]) => {
      const d = ensure()
      if (typeof d[m] === 'function') {
        return d[m](...args)
      }
      throw new Error(`[REDIS PROXY] Méthode ${m} non supportée par le driver`)
    }
  }

  // Fournir meta pour compatibilité
  proxy.driverName = 'lazy-proxy'
  return proxy
}

export default defineNitroPlugin(() => {
  const storage = useStorage()

  // Guard idempotent dans le même process (évite double mount si plugin appelé plusieurs fois)
  if ((globalThis as any)[GLOBAL_KEY]) {
    console.log('⚠️ [REDIS PLUGIN] Déjà monté, skip (idempotence)')
    return
  }
  ;(globalThis as any)[GLOBAL_KEY] = true

  try {
    storage.mount(NAMESPACE, createLazyDriver())
    console.log(`✅ [REDIS PLUGIN] Namespace "${NAMESPACE}" monté (lazy proxy)`)
  } catch (err: any) {
    // Si déjà monté, on ignore l'erreur (idempotence). Log pour debug.
    if (err && /already mounted/.test(String(err))) {
      console.warn(`⚠️ [REDIS PLUGIN] Namespace "${NAMESPACE}" déjà monté — ignoré`)
    } else {
      console.error('❌ [REDIS PLUGIN] Erreur montage:', err)
    }
  }
})
