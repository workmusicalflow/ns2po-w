// Server-Sent Events endpoint pour notifications temps réel
export default defineEventHandler(async (event) => {
  // Configuration des headers SSE
  setHeader(event, 'content-type', 'text/event-stream')
  setHeader(event, 'cache-control', 'no-cache')
  setHeader(event, 'connection', 'keep-alive')
  setHeader(event, 'x-accel-buffering', 'no') // Pour Nginx

  const encoder = new TextEncoder()

  // Stockage global des connexions actives
  if (!(globalThis as any).__sse_connections) {
    (globalThis as any).__sse_connections = new Set()
  }
  const connections = (globalThis as any).__sse_connections

  console.log('🔌 Nouvelle connexion SSE établie')

  const stream = new ReadableStream({
    start(controller) {
      // Ajouter cette connexion au pool
      connections.add(controller)
      console.log(`📊 Connexions actives: ${connections.size}`)

      // Envoi immédiat d'un message de connexion
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          timestamp: Date.now()
        })}\n\n`))
      } catch (error) {
        console.error('Erreur envoi message de connexion:', error)
      }

      // Heartbeat pour maintenir la connexion active
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          })}\n\n`))
        } catch (error) {
          // La connexion est fermée, nettoyer
          clearInterval(pingInterval)
          connections.delete(controller)
          console.log(`📊 Connexion fermée. Actives: ${connections.size}`)
        }
      }, 30000) // Ping toutes les 30 secondes

      // Stocker l'interval pour le cleanup
      ;(controller as any).__pingInterval = pingInterval
    },

    cancel(controller) {
      // Nettoyage lors de la fermeture
      const interval = (controller as any).__pingInterval
      if (interval) {
        clearInterval(interval)
      }
      connections.delete(controller)
      console.log(`❌ Connexion SSE fermée. Actives: ${connections.size}`)
    }
  })

  return stream
})

// Fonction helper pour broadcaster un événement à toutes les connexions
export function broadcastSSEEvent(eventData: any) {
  const connections = (globalThis as any).__sse_connections || new Set()
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(eventData)}\n\n`

  let successCount = 0
  let failureCount = 0

  connections.forEach((controller: any) => {
    try {
      controller.enqueue(encoder.encode(message))
      successCount++
    } catch (error) {
      // La connexion est probablement fermée
      connections.delete(controller)
      failureCount++
    }
  })

  if (successCount > 0 || failureCount > 0) {
    console.log(`📡 SSE Broadcast: ✅ ${successCount} réussis, ❌ ${failureCount} échecs`)
  }

  return { successCount, failureCount }
}