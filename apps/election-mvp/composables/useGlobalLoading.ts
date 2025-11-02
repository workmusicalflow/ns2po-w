/**
 * Composable: useGlobalLoading
 * Gestion centralisée globale des états de chargement (SSR-safe)
 *
 * Solution recommandée par Perplexity pour éviter race conditions d'hydratation
 *
 * Problème résolu :
 * - ClientOnly + initial: true créent une "fenêtre d'invisibilité"
 * - Le spinner attend l'hydratation pendant que onMounted() lance le fetch
 * - Race condition : fetch termine avant que spinner soit visible
 *
 * Solution :
 * - useState() auto-sync SSR ↔ client (pas de mismatch)
 * - État global accessible dans layout (pas de ClientOnly)
 * - withMinDuration() garantit visibilité minimum
 *
 * Usage:
 * ```ts
 * // Dans page component
 * const { withMinDuration } = useGlobalLoading()
 *
 * onMounted(async () => {
 *   await withMinDuration(async () => {
 *     await fetchData()
 *   }, 800) // Minimum 800ms de spinner visible
 * })
 * ```
 */

import { readonly } from 'vue'

export interface GlobalLoadingState {
  isLoading: Readonly<Ref<boolean>>
  loadingMessage: Readonly<Ref<string>>
  startLoading: (message?: string) => void
  stopLoading: () => void
  withMinDuration: <T>(fn: () => Promise<T>, minMs?: number) => Promise<T>
}

export function useGlobalLoading(): GlobalLoadingState {
  // useState auto-sync entre SSR et client - évite hydratation mismatch
  const isLoading = useState('global-loading', () => false)
  const loadingMessage = useState('global-loading-message', () => '')

  function startLoading(message = '') {
    const caller = new Error().stack?.split('\n')[2]?.trim() || 'Unknown'
    console.log(`[🔵 GLOBAL_LOADING] START @ ${Date.now()}ms - Message: "${message}" - From: ${caller}`)
    loadingMessage.value = message
    isLoading.value = true
    console.log(`[🔵 GLOBAL_LOADING] isLoading.value = ${isLoading.value}`)
  }

  function stopLoading() {
    const caller = new Error().stack?.split('\n')[2]?.trim() || 'Unknown'
    console.log(`[🔴 GLOBAL_LOADING] STOP @ ${Date.now()}ms - From: ${caller}`)
    isLoading.value = false
    loadingMessage.value = ''
    console.log(`[🔴 GLOBAL_LOADING] isLoading.value = ${isLoading.value}`)
  }

  /**
   * Exécute une fonction async avec garantie de durée minimum d'affichage du spinner
   * @param fn - Fonction async à exécuter
   * @param minMs - Durée minimum en millisecondes (défaut: 800ms)
   */
  async function withMinDuration<T>(
    fn: () => Promise<T>,
    minMs = 800
  ): Promise<T> {
    const startTime = Date.now()
    startLoading()

    try {
      const result = await fn()

      // Garantir durée minimum d'affichage
      const elapsed = Date.now() - startTime
      const remaining = minMs - elapsed

      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }

      return result
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading: readonly(isLoading),
    loadingMessage: readonly(loadingMessage),
    startLoading,
    stopLoading,
    withMinDuration
  }
}
