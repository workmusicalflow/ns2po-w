/**
 * Nitro Plugin: Monte un driver lazy proxy pour Redis/Memory
 *
 * Solution au problème de double exécution du plugin:
 * - Monte un proxy lazy qui décide au premier usage quel driver utiliser
 * - Guard global pour idempotence (évite double-mount dans même process)
 * - Résout le timing Railway (REDIS_URL disponible ou non)
 *
 * Crédit: Solution GPT-5 (2025-11-05)
 */

import memoryDriver from 'unstorage/drivers/memory'
import redisDriverFactory from 'unstorage/drivers/redis'

const NAMESPACE = 'cache'
const GLOBAL_KEY = '__nuxt_unstorage_cache_mounted__'

function createDriverFromEnv() {
  const url = process.env.REDIS_URL
  if (url) {
    try {
      console.log('🔄 [REDIS PROXY] Création driver Redis...')
      return redisDriverFactory({ url, ttl: 300 })
    } catch (e) {
      console.error('❌ [REDIS PROXY] Erreur création redis driver, fallback memory:', e)
      return memoryDriver()
    }
  }
  console.log('ℹ️ [REDIS PROXY] Pas de REDIS_URL, utilise memory driver')
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
