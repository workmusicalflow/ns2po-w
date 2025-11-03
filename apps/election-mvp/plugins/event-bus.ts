/**
 * Event Bus Global - Mitt Integration
 *
 * Permet la communication inter-composants via événements custom.
 * Utilisé principalement pour l'invalidation de cache après mutations.
 *
 * Événements disponibles:
 * - 'product-updated': Émis après modification/création d'un produit
 * - 'product-deleted': Émis après suppression d'un produit
 * - 'bundle-updated': Émis après modification/création d'un bundle
 *
 * @see https://github.com/developit/mitt
 */

import { defineNuxtPlugin } from '#app'
import mitt, { type Emitter } from 'mitt'

// Types des événements supportés
export type ApplicationEvents = {
  'product-updated': string | undefined // Product ID (ou undefined pour invalidation globale)
  'product-deleted': string // Product ID
  'product-created': string // Product ID
  'bundle-updated': string | undefined // Bundle ID
  'bundle-deleted': string // Bundle ID
  'category-updated': string | undefined // Category ID
}

// Type de l'emitter typé
export type ApplicationEventBus = Emitter<ApplicationEvents>

export default defineNuxtPlugin(() => {
  // Créer l'instance mitt typée
  const emitter: ApplicationEventBus = mitt<ApplicationEvents>()

  // Logger les événements en mode développement
  if (process.dev) {
    emitter.on('*', (type, event) => {
      console.log(`📡 [Event Bus] ${String(type)}:`, event)
    })
  }

  return {
    provide: {
      bus: emitter
    }
  }
})
