/**
 * Store Pinia: productStore
 *
 * Gère l'état global des produits et la coordination du rafraîchissement
 * de la liste après mutations.
 *
 * Solution recommandée par Gemini Google Search (24 sources citées):
 * Pattern robuste pour "Edit → Mutate → Back to List → See changes without F5"
 *
 * Problème résolu: bfcache + refreshNuxtData inter-pages ne fonctionne pas
 * GitHub issue: "refreshNuxtData could not invalidate cache if request
 * didn't happen on current page"
 */

import { defineStore } from 'pinia'

export const useProductStore = defineStore('product', {
  state: () => ({
    /**
     * Flag indiquant que la liste des produits doit être rafraîchie
     * Défini à true après mutations (CREATE/UPDATE/DELETE)
     * Vérifié par page liste dans onMounted() → appel refresh()
     */
    needsProductListRefresh: false,
  }),

  actions: {
    /**
     * Marque la liste des produits comme périmée (après mutation)
     * Appelé depuis pages/admin/products/[id].vue après UPDATE/CREATE
     * Ou depuis pages/admin/products/index.vue après DELETE
     */
    markProductListAsStale() {
      this.needsProductListRefresh = true
      console.log('🔄 [PINIA STORE] Liste produits marquée comme périmée')
    },

    /**
     * Réinitialise le flag après rafraîchissement réussi
     * Appelé depuis pages/admin/products/index.vue après refresh()
     */
    clearProductListStaleFlag() {
      this.needsProductListRefresh = false
      console.log('✅ [PINIA STORE] Flag périmé réinitialisé')
    },
  },
})
