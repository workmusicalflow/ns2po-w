/**
 * API Route: GET /_nuxt/builds/meta/dev.json
 * Évite l'erreur 404 pour les métadonnées de build DevTools
 */

export default defineEventHandler(async (event) => {
  // Métadonnées de build pour DevTools
  const buildMeta = {
    version: "1.0.0",
    environment: "development",
    buildTime: new Date().toISOString(),
    nuxtVersion: "3.18.1",
    status: "active",
    timestamp: Date.now()
  }

  // Headers de cache appropriés
  setHeader(event, "Content-Type", "application/json")
  setHeader(event, "Cache-Control", "no-cache")

  return buildMeta
})