/**
 * Plugin Nitro pour capturer les erreurs silencieuses
 * Solution recommandée par Gemini + Google Search Grounding (10 sources)
 * Référence: https://nuxt.com/docs/guide/directory-structure/server#server-plugins
 */

export default defineNitroPlugin((nitroApp) => {
  // Hook pour capturer TOUTES les erreurs serveur (même silencieuses)
  nitroApp.hooks.hook('error', (error, { event }) => {
    console.error('🔥 [NITRO ERROR HOOK] Erreur capturée:', {
      message: error.message,
      stack: error.stack,
      url: event?.node?.req?.url,
      method: event?.node?.req?.method,
      timestamp: new Date().toISOString()
    })
  })

  // Hook pour logger TOUTES les requêtes entrantes (debug)
  nitroApp.hooks.hook('request', (event) => {
    console.log(`🌐 [NITRO REQUEST] ${event.node.req.method} ${event.node.req.url}`)
  })

  console.log('✅ Plugin error-logger activé - Capture des erreurs silencieuses activée')
})
