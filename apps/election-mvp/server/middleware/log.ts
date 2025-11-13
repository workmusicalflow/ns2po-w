/**
 * Middleware global pour logger toutes les requêtes
 * S'exécute AVANT toute route API
 * Solution recommandée par Gemini + Google Search Grounding
 */

export default defineEventHandler((event) => {
  const method = event.node.req.method
  const url = event.node.req.url

  console.log(`📝 [MIDDLEWARE LOG] ${method} ${url} - Headers: ${JSON.stringify(event.node.req.headers['content-type'])}`)
})
