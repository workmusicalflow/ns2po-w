/**
 * Middleware pour gérer les requêtes DevTools meta
 * Évite les erreurs 404 pour /_nuxt/builds/meta/dev.json
 */

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname

  // Gérer spécifiquement la requête DevTools
  if (url === '/_nuxt/builds/meta/dev.json') {
    const buildMeta = {
      version: "1.0.0",
      environment: "development",
      buildTime: new Date().toISOString(),
      nuxtVersion: "3.18.1",
      status: "active",
      timestamp: Date.now()
    }

    setHeader(event, "Content-Type", "application/json")
    setHeader(event, "Cache-Control", "no-cache")

    return buildMeta
  }
})