/**
 * Turso Database Optimization Mutation Composable
 * SOLID Architecture - TanStack Query Mutation
 *
 * Wrapper pour POST /api/admin/turso-optimize
 * Opérations : VACUUM, ANALYZE, cleanup logs, integrity check
 *
 * Use case : Admin UI "Optimize Database" button
 * Fréquence recommandée : Mensuel ou après imports massifs de données
 */

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationReturnType
} from '@tanstack/vue-query'

/**
 * Single operation result from Turso optimization
 */
interface TursoOperation {
  operation: 'vacuum' | 'analyze' | 'cleanup_logs' | 'integrity_check'
  status: 'success' | 'error' | 'warning'
  message: string
}

/**
 * Summary statistics for optimization run
 */
interface TursoOptimizationSummary {
  totalOperations: number
  successful: number
  errors: number
  executionTimeMs: number
}

/**
 * Complete response from POST /api/admin/turso-optimize
 */
interface TursoOptimizationResponse {
  success: boolean
  summary: TursoOptimizationSummary
  operations: TursoOperation[]
  timestamp: string
  error?: string
}

/**
 * Mutation composable pour optimisation Turso Database
 *
 * @param options - Options TanStack Query personnalisées
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { mutate: optimizeDb, isPending, isSuccess } = useTursoOptimizeMutation({
 *   onSuccess: (data) => {
 *     if (data.success) {
 *       toast.success(`✅ Base optimisée en ${data.summary.executionTimeMs}ms`)
 *     }
 *   }
 * })
 *
 * // Trigger optimization
 * const handleOptimize = () => optimizeDb()
 * </script>
 *
 * <template>
 *   <button @click="handleOptimize" :disabled="isPending">
 *     {{ isPending ? 'Optimisation...' : 'Optimiser la base' }}
 *   </button>
 * </template>
 * ```
 */
export function useTursoOptimizeMutation(
  options?: UseMutationOptions<TursoOptimizationResponse, Error, void>
): UseMutationReturnType<TursoOptimizationResponse, Error, void, unknown> {
  return useMutation({
    mutationFn: async (): Promise<TursoOptimizationResponse> => {
      const response = await $fetch('/api/admin/turso-optimize', {
        method: 'POST'
      })

      // Type assertion pour garantir structure attendue
      return response as TursoOptimizationResponse
    },

    // ⚠️ Pas d'optimistic updates pour opération DB critique
    // ⚠️ Pas d'invalidation queries (opération administrative isolée)

    ...options
  })
}

/**
 * Helper pour formater le résultat d'optimisation en message utilisateur
 *
 * @param response - Réponse API d'optimisation
 * @returns Message formaté pour affichage
 *
 * @example
 * ```ts
 * const message = formatOptimizationMessage(data)
 * // "✅ 4 opérations réussies en 1.2s"
 * ```
 */
export function formatOptimizationMessage(response: TursoOptimizationResponse): string {
  if (!response.success && response.error) {
    return `❌ Erreur : ${response.error}`
  }

  const { summary } = response
  const timeInSeconds = (summary.executionTimeMs / 1000).toFixed(1)

  if (summary.errors > 0) {
    return `⚠️ ${summary.successful}/${summary.totalOperations} opérations réussies (${summary.errors} erreurs) - ${timeInSeconds}s`
  }

  return `✅ ${summary.successful} opérations réussies en ${timeInSeconds}s`
}

/**
 * Helper pour extraire les opérations en erreur
 *
 * @param response - Réponse API d'optimisation
 * @returns Liste des messages d'erreur
 *
 * @example
 * ```ts
 * const errors = getOptimizationErrors(data)
 * if (errors.length > 0) {
 *   console.error('Erreurs détectées:', errors)
 * }
 * ```
 */
export function getOptimizationErrors(response: TursoOptimizationResponse): string[] {
  return response.operations
    .filter(op => op.status === 'error')
    .map(op => `${op.operation}: ${op.message}`)
}

/**
 * Type exports pour utilisation externe
 */
export type {
  TursoOperation,
  TursoOptimizationSummary,
  TursoOptimizationResponse
}
