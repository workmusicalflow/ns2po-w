/**
 * Composable: useLoadingState
 * Gestion centralisée des états de chargement avec anti-flash
 *
 * Features:
 * - Timer anti-flash (évite spinner < 200ms)
 * - Compatible TanStack Query isPending
 * - Support async/await
 * - SSR-safe avec initial: true (pattern Gemini + Perplexity)
 * - Watch intelligent pour éviter reset timer
 *
 * Usage:
 * ```ts
 * const { isLoading, withLoading } = useLoadingState({ initial: true })
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

import { ref, watch } from 'vue'

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

  /**
   * État initial du loading
   * Utile pour SSR : mettre à true pour garantir affichage au montage client
   * @default false
   */
  initial?: boolean
}

export function useLoadingState(options: LoadingStateOptions = {}) {
  const { minDuration = 200, delay = 0, initial = false } = options

  const isLoading = ref(initial)
  const loadingStartTime = ref(0) // Initialisé à 0, sera Date.now() quand le chargement démarre
  let delayTimeout: ReturnType<typeof setTimeout> | null = null

  // Watch intelligent: définit loadingStartTime uniquement lors de la transition false → true
  // Avec immediate: initial, s'exécute au montage client si initial: true
  // Évite le reset du timer lors des appels ultérieurs à startLoading()
  watch(isLoading, (newValue, oldValue) => {
    if (newValue === true && oldValue === false) {
      loadingStartTime.value = Date.now()
    }
  }, { immediate: initial })

  function startLoading() {
    // Ne déclenche changement que si pas déjà en chargement
    // Le watch ci-dessus gérera la définition de loadingStartTime
    if (!isLoading.value) {
      if (delay > 0) {
        // Mode delayed: attendre avant d'afficher
        delayTimeout = setTimeout(() => {
          isLoading.value = true
        }, delay)
      } else {
        // Mode immédiat
        isLoading.value = true
      }
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

    // Garantir durée minimum d'affichage depuis loadingStartTime
    const elapsed = Date.now() - loadingStartTime.value
    const remaining = minDuration - elapsed

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining))
    }

    isLoading.value = false
    loadingStartTime.value = 0 // Réinitialise pour le prochain cycle
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
