/**
 * Nitro Plugin: Monte le driver Redis au runtime
 *
 * Railway injecte REDIS_URL au runtime, pas au build time.
 * Ce plugin monte dynamiquement le driver Redis si REDIS_URL est présent.
 */

import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const redisUrl = process.env.REDIS_URL

  if (redisUrl) {
    console.log('🔄 [REDIS PLUGIN] Détection REDIS_URL, montage driver Redis...')

    try {
      // Démonte le namespace 'cache' existant (memory driver par défaut de nuxt.config.ts)
      storage.unmount('cache')
      console.log('🔄 [REDIS PLUGIN] Namespace "cache" démonté')

      // Monte le driver Redis avec ioredis
      const driver = redisDriver({
        url: redisUrl, // redis://default:password@redis.railway.internal:6379
        ttl: 300,      // TTL par défaut 5 minutes
      })

      // Monte le storage 'cache' avec le driver Redis
      storage.mount('cache', driver)

      console.log('✅ [REDIS PLUGIN] Driver Redis monté sur namespace "cache"')
      console.log(`📍 [REDIS PLUGIN] URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`) // Masquer password
    } catch (error) {
      console.error('❌ [REDIS PLUGIN] Erreur montage driver Redis:', error)
      console.warn('⚠️ [REDIS PLUGIN] Fallback vers driver memory')
    }
  } else {
    console.log('ℹ️ [REDIS PLUGIN] Pas de REDIS_URL, utilise driver memory (dev local)')
  }
})
