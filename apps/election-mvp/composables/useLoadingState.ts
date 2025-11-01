/**
 * Composable: useLoadingState
 * Gestion centralisée des états de chargement avec anti-flash
 *
 * Features:
 * - Timer anti-flash (évite spinner < 200ms)
 * - Compatible TanStack Query isPending
 * - Support async/await
 *
 * Usage:
 * ```ts
 * const { isLoading, withLoading } = useLoadingState()
 *
 * // Méthode 1: Wrapper automatique
 * await withLoading(async () => {
 *   await fetchData()
 * })
 *
 * // Méthode 2: Contrôle manuel
 * startLoading()
 * try {
 *   await fetchData()
 * } finally {
 *   stopLoading()
 * }
 * ```
 */

import { ref } from 'vue'

export interface LoadingStateOptions {
  /**
   * Délai minimum d'affichage du loading (ms)
   * Évite le flash si l'opération est rapide
   * @default 200
   */
  minDuration?: number

  /**
   * Afficher le loading seulement si l'opération dépasse ce délai
   * Évite le spinner pour opérations < 200ms
   * @default 0
   */
  delay?: number
}

export function useLoadingState(options: LoadingStateOptions = {}) {
  const { minDuration = 200, delay = 0 } = options

  const isLoading = ref(false)
  const loadingStartTime = ref<number | null>(null)
  let delayTimeout: ReturnType<typeof setTimeout> | null = null

  function startLoading() {
    if (delay > 0) {
      // Mode delayed: attendre avant d'afficher
      delayTimeout = setTimeout(() => {
        isLoading.value = true
        loadingStartTime.value = Date.now()
      }, delay)
    } else {
      // Mode immédiat
      isLoading.value = true
      loadingStartTime.value = Date.now()
    }
  }

  async function stopLoading() {
    // Annuler le delay si l'opération est terminée avant
    if (delayTimeout) {
      clearTimeout(delayTimeout)
      delayTimeout = null
    }

    if (!isLoading.value) {
      return
    }

    // Garantir durée minimum d'affichage
    if (loadingStartTime.value && minDuration > 0) {
      const elapsed = Date.now() - loadingStartTime.value
      const remaining = minDuration - elapsed

      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }
    }

    isLoading.value = false
    loadingStartTime.value = null
  }

  /**
   * Wrapper qui gère automatiquement start/stop loading
   * @param fn Function async à exécuter
   * @returns Résultat de la fonction
   */
  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    startLoading()
    try {
      return await fn()
    } finally {
      await stopLoading()
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  }
}
