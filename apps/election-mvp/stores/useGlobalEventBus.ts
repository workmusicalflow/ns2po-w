/**
 * Global Event Bus - Store Synchronization
 * SOLID Architecture - Cross-Store Communication
 * Coordinates state changes between Product and Bundle stores
 */

import { defineStore } from 'pinia'
import { useProductStore } from './useProductStore'
import { useBundleStore } from './useBundleStore'

// Event Types
export type GlobalEvent =
  | { type: 'product.created'; payload: { product: any } }
  | { type: 'product.updated'; payload: { productId: string; product: any; changes: any } }
  | { type: 'product.deleted'; payload: { productId: string } }
  | { type: 'product.bulk_updated'; payload: { productIds: string[]; products: any[] } }
  | { type: 'product.deactivated'; payload: { productId: string; productName: string } }
  | { type: 'product.price_changed'; payload: { productId: string; oldPrice: number; newPrice: number } }
  | { type: 'bundle.created'; payload: { bundle: any } }
  | { type: 'bundle.updated'; payload: { bundleId: string; bundle: any } }
  | { type: 'bundle.deleted'; payload: { bundleId: string } }
  | { type: 'bundle.product_added'; payload: { bundleId: string; productId: string; quantity: number } }
  | { type: 'bundle.product_removed'; payload: { bundleId: string; productId: string } }
  | { type: 'bundle.recalculated'; payload: { bundleId: string; newTotal: number } }
  | { type: 'bundle.integrity.issues_found'; payload: { bundleId: string; issues: string[]; orphanedProducts: string[] } }
  | { type: 'bundle.integrity.cleanup_completed'; payload: { bundleId: string; removedProducts: string[]; cleanupCount: number } }
  | { type: 'product.reference.validated'; payload: { productId: string; isValid: boolean; issues: any[] } }
  | { type: 'product.reference.orphaned'; payload: { productId: string; bundleIds: string[]; reason: string } }

// Event Listener Type
export type EventListener<T = any> = (event: GlobalEvent & { type: T }) => void | Promise<void>

interface EventBusState {
  eventHistory: Array<GlobalEvent & { timestamp: Date; id: string }>
  isDebugMode: boolean
}

// Global listeners storage (client-only, not serialized)
const listeners = new Map<string, EventListener[]>()

export const useGlobalEventBus = defineStore('globalEventBus', {
  state: (): EventBusState => ({
    eventHistory: [],
    isDebugMode: process.env.NODE_ENV === 'development'
  }),

  getters: {
    getListenerCount: () => (eventType: string): number => {
      return listeners.get(eventType)?.length || 0
    },

    getRecentEvents: (state) => (limit = 10) => {
      return state.eventHistory
        .slice(-limit)
        .reverse()
    },

    getEventsByType: (state) => (eventType: string) => {
      return state.eventHistory.filter(event => event.type === eventType)
    }
  },

  actions: {
    // Event Management
    on<T extends GlobalEvent['type']>(eventType: T, listener: EventListener<T>): void {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, [])
      }

      listeners.get(eventType)!.push(listener as EventListener)

      if (this.isDebugMode) {
        console.log(`[EventBus] Registered listener for "${eventType}". Total listeners: ${this.getListenerCount(eventType)}`)
      }
    },

    off<T extends GlobalEvent['type']>(eventType: T, listener: EventListener<T>): void {
      const eventListeners = listeners.get(eventType)
      if (eventListeners) {
        const index = eventListeners.indexOf(listener as EventListener)
        if (index > -1) {
          eventListeners.splice(index, 1)

          if (this.isDebugMode) {
            console.log(`[EventBus] Removed listener for "${eventType}". Remaining listeners: ${this.getListenerCount(eventType)}`)
          }
        }
      }
    },

    async emit<T extends GlobalEvent['type']>(eventType: T, payload: Extract<GlobalEvent, { type: T }>['payload']): Promise<void> {
      const event: GlobalEvent = { type: eventType, payload } as GlobalEvent
      const eventWithMeta = {
        ...event,
        timestamp: new Date(),
        id: `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      // Add to history
      this.eventHistory.push(eventWithMeta)

      // Keep only last 100 events
      if (this.eventHistory.length > 100) {
        this.eventHistory.shift()
      }

      if (this.isDebugMode) {
        console.log(`[EventBus] Emitting "${eventType}":`, payload)
      }

      // Notify listeners
      const eventListeners = listeners.get(eventType) || []

      // Execute listeners in parallel
      const promises = eventListeners.map(async (listener) => {
        try {
          await listener(event)
        } catch (error) {
          console.error(`[EventBus] Error in listener for "${eventType}":`, error)
        }
      })

      await Promise.all(promises)

      if (this.isDebugMode) {
        console.log(`[EventBus] Event "${eventType}" processed by ${eventListeners.length} listeners`)
      }
    },

    // Store Synchronization Setup
    initializeStoreSynchronization(): void {
      // Only initialize on client side to avoid Pinia SSR issues
      if (typeof window === 'undefined') {
        if (this.isDebugMode) {
          console.log('[EventBus] Skipping store synchronization on server side')
        }
        return
      }

      const productStore = useProductStore()
      const bundleStore = useBundleStore()

      if (this.isDebugMode) {
        console.log('[EventBus] Initializing store synchronization...')
      }

      // Product Events -> Bundle Store Sync
      this.on('product.updated', async (event) => {
        bundleStore.handleProductUpdate(event.payload.productId, event.payload.product)
      })

      this.on('product.deleted', async (event) => {
        bundleStore.handleProductDelete(event.payload.productId)
      })

      this.on('product.price_changed', async (event) => {
        // Recalculate all bundles that contain this product
        // This is a simplified approach - in production, you might want to be more selective
        bundleStore.clearCache()
      })

      // Bundle Events -> Product Store Sync (if needed)
      this.on('bundle.product_added', async (event) => {
        // Optionally invalidate product cache or update product usage stats
        productStore.invalidateProduct(event.payload.productId)
      })

      this.on('bundle.product_removed', async (event) => {
        // Optionally update product usage stats
        productStore.invalidateProduct(event.payload.productId)
      })

      if (this.isDebugMode) {
        console.log('[EventBus] Store synchronization initialized')
      }
    },

    // Helper methods for stores to emit events
    emitProductCreated(product: any): void {
      this.emit('product.created', { product })
    },

    emitProductUpdated(productId: string, product: any, changes: any): void {
      this.emit('product.updated', { productId, product, changes })

      // Also emit price change if price was updated
      if (changes.price !== undefined || changes.basePrice !== undefined) {
        this.emit('product.price_changed', {
          productId,
          oldPrice: changes.price || changes.basePrice,
          newPrice: product.price || product.basePrice
        })
      }
    },

    emitProductDeleted(productId: string): void {
      this.emit('product.deleted', { productId })
    },

    emitProductBulkUpdated(productIds: string[], products: any[]): void {
      this.emit('product.bulk_updated', { productIds, products })
    },

    emitBundleCreated(bundle: any): void {
      this.emit('bundle.created', { bundle })
    },

    emitBundleUpdated(bundleId: string, bundle: any): void {
      this.emit('bundle.updated', { bundleId, bundle })
    },

    emitBundleDeleted(bundleId: string): void {
      this.emit('bundle.deleted', { bundleId })
    },

    emitBundleProductAdded(bundleId: string, productId: string, quantity: number): void {
      this.emit('bundle.product_added', { bundleId, productId, quantity })
    },

    emitBundleProductRemoved(bundleId: string, productId: string): void {
      this.emit('bundle.product_removed', { bundleId, productId })
    },

    emitBundleRecalculated(bundleId: string, newTotal: number): void {
      this.emit('bundle.recalculated', { bundleId, newTotal })
    },

    // Debugging & Monitoring
    enableDebugMode(): void {
      this.isDebugMode = true
      console.log('[EventBus] Debug mode enabled')
    },

    disableDebugMode(): void {
      this.isDebugMode = false
    },

    clearEventHistory(): void {
      this.eventHistory = []
      if (this.isDebugMode) {
        console.log('[EventBus] Event history cleared')
      }
    },

    removeAllListeners(): void {
      listeners.clear()
      if (this.isDebugMode) {
        console.log('[EventBus] All listeners removed')
      }
    },

    getEventStats(): {
      totalEvents: number
      eventsByType: Record<string, number>
      listenersByType: Record<string, number>
    } {
      const eventsByType: Record<string, number> = {}
      const listenersByType: Record<string, number> = {}

      // Count events by type
      this.eventHistory.forEach(event => {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      })

      // Count listeners by type
      listeners.forEach((eventListeners, eventType) => {
        listenersByType[eventType] = eventListeners.length
      })

      return {
        totalEvents: this.eventHistory.length,
        eventsByType,
        listenersByType
      }
    }
  }
})

// Auto-initialize store synchronization when the event bus is created
let isInitialized = false

export function initializeGlobalEventBus() {
  if (isInitialized) return

  // Only initialize on client side to avoid Pinia SSR issues
  if (typeof window === 'undefined') {
    console.log('[EventBus] Skipping initialization on server side')
    return
  }

  const eventBus = useGlobalEventBus()
  eventBus.initializeStoreSynchronization()
  isInitialized = true
}

// Export helper function for easier event emission
export function useEventEmitter() {
  // Only on client side to avoid Pinia SSR issues
  if (typeof window === 'undefined') {
    // Return a no-op implementation for SSR
    return {
      product: {
        created: () => {},
        updated: () => {},
        deleted: () => {}
      },
      bundle: {
        created: () => {},
        updated: () => {},
        deleted: () => {},
        productAdded: () => {},
        productRemoved: () => {},
        recalculated: () => {}
      }
    }
  }

  const eventBus = useGlobalEventBus()

  return {
    product: {
      created: (product: any) => eventBus.emitProductCreated(product),
      updated: (productId: string, product: any, changes: any) => eventBus.emitProductUpdated(productId, product, changes),
      deleted: (productId: string) => eventBus.emitProductDeleted(productId),
      bulkUpdated: (productIds: string[], products: any[]) => eventBus.emitProductBulkUpdated(productIds, products)
    },
    bundle: {
      created: (bundle: any) => eventBus.emitBundleCreated(bundle),
      updated: (bundleId: string, bundle: any) => eventBus.emitBundleUpdated(bundleId, bundle),
      deleted: (bundleId: string) => eventBus.emitBundleDeleted(bundleId),
      productAdded: (bundleId: string, productId: string, quantity: number) =>
        eventBus.emitBundleProductAdded(bundleId, productId, quantity),
      productRemoved: (bundleId: string, productId: string) =>
        eventBus.emitBundleProductRemoved(bundleId, productId),
      recalculated: (bundleId: string, newTotal: number) =>
        eventBus.emitBundleRecalculated(bundleId, newTotal)
    }
  }
}