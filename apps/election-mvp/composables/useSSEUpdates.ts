// 🚨 MIGRATION TANSTACK QUERY PURE - Phase 1.3
// useProductsStore supprimé, remplacé par useQueryClient
import { useQueryClient } from '@tanstack/vue-query'
import { useBundleStore } from '../stores/useBundleStore'
// Auto-imported via Nuxt 3: globalNotifications

interface SSEMessage {
  type: 'connected' | 'ping' | 'product:updated' | 'product:created' | 'product:deleted' | 'bundle:updated'
  data?: any
  timestamp?: number
}

export const useSSEUpdates = () => {
  const eventSource = ref<EventSource | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  // Ne connecter que côté client et sur les pages admin
  const shouldConnect = () => {
    if (!process.client) return false
    const route = useRoute()
    return route.path.startsWith('/admin')
  }

  const connect = () => {
    if (!shouldConnect()) return

    // Ne pas se reconnecter si déjà connecté
    if (eventSource.value?.readyState === EventSource.OPEN) {
      console.log('✅ SSE déjà connecté')
      return
    }

    console.log('🔌 Connexion SSE...')

    try {
      eventSource.value = new EventSource('/api/sse')

      eventSource.value.onopen = () => {
        console.log('✅ SSE connecté avec succès')
        isConnected.value = true
        reconnectAttempts.value = 0
      }

      eventSource.value.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data)
          handleSSEMessage(message)
        } catch (error) {
          console.error('❌ Erreur parsing SSE:', error)
        }
      }

      eventSource.value.onerror = (error) => {
        console.error('❌ Erreur SSE:', error)
        isConnected.value = false
        eventSource.value?.close()
        eventSource.value = null

        // Tentative de reconnexion
        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++
          console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.value}/${maxReconnectAttempts}...`)
          setTimeout(() => {
            connect()
          }, reconnectDelay * reconnectAttempts.value)
        } else {
          console.error('❌ Impossible de se reconnecter après', maxReconnectAttempts, 'tentatives')
        }
      }
    } catch (error) {
      console.error('❌ Erreur création EventSource:', error)
      isConnected.value = false
    }
  }

  const handleSSEMessage = (message: SSEMessage) => {
    // 🚨 MIGRATION TANSTACK QUERY PURE - Phase 1.3
    // Pinia store supprimé, utilisation TanStack Query uniquement
    const queryClient = useQueryClient()
    const bundleStore = useBundleStore()

    switch (message.type) {
      case 'connected':
        console.log('🎉 Connexion SSE établie:', new Date(message.timestamp || 0).toLocaleTimeString())
        break

      case 'ping':
        // Heartbeat, ne rien faire
        break

      case 'product:updated':
        console.log('📝 Mise à jour produit reçue via SSE:', message.data?.name)
        if (message.data) {
          // ✅ TanStack Query: Update cache optimiste + invalidation
          queryClient.setQueryData(['products', 'detail', message.data.id], message.data)
          queryClient.invalidateQueries({ queryKey: ['products', 'list'] })

          // Notification visuelle
          const { crudSuccess } = globalNotifications
          crudSuccess.updated(`Produit "${message.data.name}" mis à jour en temps réel`, 'product')
        }
        break

      case 'product:created':
        console.log('➕ Nouveau produit reçu via SSE:', message.data?.name)
        if (message.data) {
          // ✅ TanStack Query: Invalidation liste pour re-fetch
          queryClient.invalidateQueries({ queryKey: ['products', 'list'] })

          // Notification visuelle
          const { crudSuccess } = globalNotifications
          crudSuccess.created(`Nouveau produit "${message.data.name}" ajouté`, 'product')
        }
        break

      case 'product:deleted':
        console.log('🗑️ Suppression produit reçue via SSE:', message.data?.id)
        if (message.data?.id) {
          // ✅ TanStack Query: Suppression cache + invalidation liste
          queryClient.removeQueries({ queryKey: ['products', 'detail', message.data.id] })
          queryClient.invalidateQueries({ queryKey: ['products', 'list'] })

          // Notification visuelle
          const { crudSuccess } = globalNotifications
          crudSuccess.deleted(`Produit supprimé`, 'product')
        }
        break

      case 'bundle:updated':
        console.log('📦 Mise à jour bundle reçue via SSE:', message.data?.name)
        if (message.data) {
          // Update bundle store with fresh server data
          const existingBundle = bundleStore.getBundleById(message.data.id)
          if (existingBundle) {
            // Update the bundle in the store
            const index = bundleStore.bundles.findIndex(b => b.id === message.data.id)
            if (index !== -1) {
              bundleStore.bundles[index] = message.data
            }

            // Update selected bundle if it's the same bundle
            if (bundleStore.selectedBundle?.id === message.data.id) {
              bundleStore.setSelectedBundle(message.data)

              // Update products if provided
              if (message.data.products) {
                bundleStore.selectedBundleProducts = message.data.products
              }
            }
          }

          // Clear relevant caches to ensure fresh data
          bundleStore.calculationCache.delete(message.data.id)
          bundleStore.aggregateCache.delete(message.data.id)

          // Show notification using the fresh server data
          if (message.data.products && message.data.products.length > 0) {
            const { crudSuccess } = globalNotifications
            const totalQuantity = message.data.products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)
            crudSuccess.updated(
              `Bundle "${message.data.name}" mis à jour - ${message.data.products.length} produit(s), ${totalQuantity} articles total`,
              'bundle'
            )
          } else {
            const { crudSuccess } = globalNotifications
            crudSuccess.updated(`Bundle "${message.data.name}" mis à jour en temps réel`, 'bundle')
          }
        }
        break

      default:
        console.warn('⚠️ Type de message SSE inconnu:', message.type)
    }
  }

  const disconnect = () => {
    if (eventSource.value) {
      console.log('🔌 Déconnexion SSE...')
      eventSource.value.close()
      eventSource.value = null
      isConnected.value = false
      reconnectAttempts.value = 0
    }
  }

  // Auto-connexion sur les pages admin
  onMounted(() => {
    if (shouldConnect()) {
      connect()
    }
  })

  // Déconnexion propre au démontage
  onUnmounted(() => {
    disconnect()
  })

  // Reconnexion lors du focus de la fenêtre
  if (process.client) {
    const handleFocus = () => {
      if (shouldConnect() && !isConnected.value) {
        console.log('🔄 Reconnexion SSE suite au focus...')
        connect()
      }
    }

    const handleBlur = () => {
      // Optionnel : déconnecter lors de la perte de focus pour économiser les ressources
      // disconnect()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    onUnmounted(() => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    })
  }

  return {
    connect,
    disconnect,
    isConnected: readonly(isConnected),
    reconnectAttempts: readonly(reconnectAttempts)
  }
}