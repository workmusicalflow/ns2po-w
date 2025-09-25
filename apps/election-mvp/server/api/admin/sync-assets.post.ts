/**
 * API Route: POST /api/admin/sync-assets
 * Synchronise les assets Cloudinary existants vers la base de données Turso
 */

import { defineEventHandler, createError } from 'h3'
import { cloudinaryService } from '../../utils/cloudinaryService'
import { assetService } from '../../services/assetService'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('🔄 Début de la synchronisation Cloudinary → Turso')

    // Variables de comptage
    let totalProcessed = 0
    let totalSynced = 0
    let totalUpdated = 0
    let totalErrors = 0
    let nextCursor: string | undefined = undefined

    // Synchronisation par lots avec pagination
    do {
      try {
        // Récupérer les assets Cloudinary par lots
        console.log(`📥 Récupération des assets Cloudinary${nextCursor ? ` (cursor: ${nextCursor.slice(0, 20)}...)` : ''}`)

        const cloudinaryResult = await cloudinaryService.listResources({
          prefix: 'ns2po/', // Tous les assets NS2PO
          max_results: 100, // 100 assets par lot pour éviter les timeouts
          next_cursor: nextCursor,
          tags: true, // Inclure les tags
          context: true // Inclure le contexte (alt_text, caption)
        })

        console.log(`📦 ${cloudinaryResult.resources.length} assets récupérés de Cloudinary`)

        // Traiter chaque asset
        for (const resource of cloudinaryResult.resources) {
          try {
            // Vérifier s'il faut traiter cet asset (éviter les assets système)
            if (resource.public_id.startsWith('sample') || resource.public_id.includes('cloudinary')) {
              continue
            }

            const existingAsset = await assetService.getAssetByPublicId(resource.public_id)
            const isUpdate = !!existingAsset

            // Synchroniser l'asset
            await assetService.upsertAssetFromCloudinary(resource)

            totalProcessed++
            if (isUpdate) {
              totalUpdated++
            } else {
              totalSynced++
            }

            // Log de progression tous les 10 assets
            if (totalProcessed % 10 === 0) {
              console.log(`⚡ Progression: ${totalProcessed} assets traités`)
            }

          } catch (assetError) {
            totalErrors++
            console.error(`❌ Erreur traitement asset ${resource.public_id}:`, assetError)
          }
        }

        nextCursor = cloudinaryResult.next_cursor

        // Petite pause pour éviter de surcharger les services
        if (nextCursor) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (batchError) {
        console.error('❌ Erreur lors du traitement d\'un lot:', batchError)
        totalErrors++
        break // Arrêter la synchronisation en cas d'erreur grave
      }

    } while (nextCursor)

    const duration = Date.now() - startTime
    const message = `Synchronisation terminée en ${Math.round(duration / 1000)}s`

    console.log(`✅ ${message}`)
    console.log(`📊 Résultats: ${totalSynced} nouveaux, ${totalUpdated} mis à jour, ${totalErrors} erreurs`)

    // Retourner le résultat
    return {
      success: true,
      message,
      data: {
        totalProcessed,
        totalSynced: totalSynced,
        totalUpdated: totalUpdated,
        totalErrors,
        duration
      },
      source: 'cloudinary-sync',
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Erreur générale synchronisation Cloudinary:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la synchronisation Cloudinary',
      data: {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration
      }
    })
  }
})