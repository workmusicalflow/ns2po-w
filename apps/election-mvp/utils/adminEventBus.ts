// Types pour les événements admin
export interface AdminEvents {
  // Événements produits
  'products:updated': any
  'products:created': any
  'products:deleted': string
  'products:invalidate': void

  // Événements images produits (NOUVEAU pour synchronisation Cloudinary)
  'product.image_added': {
    productId: string
    imagePublicId: string
    imageUrl: string
    metadata?: {
      width?: number
      height?: number
      format?: string
      size?: number
    }
  }
  'product.image_removed': {
    productId: string
    imagePublicId: string
    remainingImages: string[]
  }
  'product.images_reordered': {
    productId: string
    newOrder: string[]
  }
  'product.image_metadata_updated': {
    productId: string
    imagePublicId: string
    metadata: {
      alt?: string
      caption?: string
      tags?: string[]
      transformations?: Record<string, any>
    }
  }

  // Événements categories (extensible)
  'categories:updated': any
  'categories:created': any
  'categories:deleted': string
  'categories:invalidate': void

  // Événements bundles (extensible)
  'bundles:updated': any
  'bundles:created': any
  'bundles:deleted': string
  'bundles:invalidate': void

  // Événements génériques
  'admin:refresh': string // nom de la ressource à rafraîchir
  'admin:error': { message: string; context?: string }
  'admin:success': { message: string; context?: string }
}

type EventCallback<T = any> = (data: T) => void

class AdminEventBus {
  private events = new Map<keyof AdminEvents, Set<EventCallback>>()

  // Écouter un événement
  on<K extends keyof AdminEvents>(event: K, callback: EventCallback<AdminEvents[K]>) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback as EventCallback)

    // Retourner une fonction de nettoyage
    return () => this.off(event, callback)
  }

  // Supprimer un listener
  off<K extends keyof AdminEvents>(event: K, callback: EventCallback<AdminEvents[K]>) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.delete(callback as EventCallback)

      // Nettoyer si plus aucun listener
      if (callbacks.size === 0) {
        this.events.delete(event)
      }
    }
  }

  // Émettre un événement
  emit<K extends keyof AdminEvents>(event: K, data: AdminEvents[K]) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${String(event)}:`, error)
        }
      })
    }

    // Log en développement
    if (process.dev) {
      console.log(`🚀 AdminEventBus: ${String(event)}`, data)
    }
  }

  // Écouter une seule fois
  once<K extends keyof AdminEvents>(event: K, callback: EventCallback<AdminEvents[K]>) {
    const wrappedCallback = (data: AdminEvents[K]) => {
      callback(data)
      this.off(event, wrappedCallback)
    }

    return this.on(event, wrappedCallback)
  }

  // Supprimer tous les listeners d'un événement
  removeAllListeners(event?: keyof AdminEvents) {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  // Debug: lister tous les événements actifs
  getActiveEvents(): string[] {
    return Array.from(this.events.keys()).map(String)
  }

  // Debug: compter les listeners
  getListenerCount(event: keyof AdminEvents): number {
    return this.events.get(event)?.size || 0
  }
}

// Singleton instance
export const adminEventBus = new AdminEventBus()

// Helper composable pour usage dans les composants Vue
export const useAdminEventBus = () => {
  const cleanupFunctions = ref<Array<() => void>>([])

  const on = <K extends keyof AdminEvents>(
    event: K,
    callback: EventCallback<AdminEvents[K]>
  ) => {
    const cleanup = adminEventBus.on(event, callback)
    cleanupFunctions.value.push(cleanup)
    return cleanup
  }

  const emit = <K extends keyof AdminEvents>(event: K, data: AdminEvents[K]) => {
    adminEventBus.emit(event, data)
  }

  // Nettoyage automatique au démontage
  onBeforeUnmount(() => {
    cleanupFunctions.value.forEach(cleanup => cleanup())
    cleanupFunctions.value = []
  })

  return {
    on,
    emit,
    once: adminEventBus.once.bind(adminEventBus),
    off: adminEventBus.off.bind(adminEventBus)
  }
}

// Helpers spécifiques pour les produits
export const useProductsEventBus = () => {
  const { on, emit } = useAdminEventBus()

  const onProductUpdated = (callback: EventCallback<any>) =>
    on('products:updated', callback)

  const onProductCreated = (callback: EventCallback<any>) =>
    on('products:created', callback)

  const onProductDeleted = (callback: EventCallback<string>) =>
    on('products:deleted', callback)

  const onProductsInvalidate = (callback: EventCallback<void>) =>
    on('products:invalidate', callback)

  const emitProductUpdated = (product: any) =>
    emit('products:updated', product)

  const emitProductCreated = (product: any) =>
    emit('products:created', product)

  const emitProductDeleted = (productId: string) =>
    emit('products:deleted', productId)

  const emitProductsInvalidate = () =>
    emit('products:invalidate', undefined)

  return {
    onProductUpdated,
    onProductCreated,
    onProductDeleted,
    onProductsInvalidate,
    emitProductUpdated,
    emitProductCreated,
    emitProductDeleted,
    emitProductsInvalidate
  }
}

// Helpers spécifiques pour les images produits (NOUVEAU pour synchronisation Cloudinary)
export const useProductImagesEventBus = () => {
  const { on, emit } = useAdminEventBus()

  // Event listeners
  const onImageAdded = (callback: EventCallback<AdminEvents['product.image_added']>) =>
    on('product.image_added', callback)

  const onImageRemoved = (callback: EventCallback<AdminEvents['product.image_removed']>) =>
    on('product.image_removed', callback)

  const onImagesReordered = (callback: EventCallback<AdminEvents['product.images_reordered']>) =>
    on('product.images_reordered', callback)

  const onImageMetadataUpdated = (callback: EventCallback<AdminEvents['product.image_metadata_updated']>) =>
    on('product.image_metadata_updated', callback)

  // Event emitters
  const emitImageAdded = (productId: string, imagePublicId: string, imageUrl: string, metadata?: any) =>
    emit('product.image_added', { productId, imagePublicId, imageUrl, metadata })

  const emitImageRemoved = (productId: string, imagePublicId: string, remainingImages: string[]) =>
    emit('product.image_removed', { productId, imagePublicId, remainingImages })

  const emitImagesReordered = (productId: string, newOrder: string[]) =>
    emit('product.images_reordered', { productId, newOrder })

  const emitImageMetadataUpdated = (productId: string, imagePublicId: string, metadata: any) =>
    emit('product.image_metadata_updated', { productId, imagePublicId, metadata })

  return {
    // Listeners
    onImageAdded,
    onImageRemoved,
    onImagesReordered,
    onImageMetadataUpdated,
    // Emitters
    emitImageAdded,
    emitImageRemoved,
    emitImagesReordered,
    emitImageMetadataUpdated
  }
}