/**
 * Service de gestion des réalisations
 * ✅ SIMPLIFIÉ: Logique conditionnelle au lieu de Strategy Pattern (YAGNI)
 *
 * Responsabilités:
 * - Suppression orchestrée (DB + Cloudinary optionnel)
 * - Gestion blacklist auto-discovery
 *
 * Refactor Sprint 2-3: Élimination over-engineering (4 classes Strategy → fonctions simples)
 */

import type { Client } from "@libsql/client"
import { v2 as cloudinary } from "cloudinary"

/**
 * Types pour résultats suppression Cloudinary
 */
export interface CloudinaryDeletionResult {
  totalAssets: number
  successCount: number
  failureCount: number
  invalidationRequested: boolean
  failures: Array<{ publicId: string; error: string }>
  duration: number
}

export interface CloudinaryDeletionOptions {
  invalidate?: boolean
  resource_type?: 'image' | 'video' | 'raw'
  type?: 'upload' | 'private' | 'authenticated'
  skipOnError?: boolean
}

/**
 * Supprime des assets Cloudinary avec retry logic et métriques
 * ✅ SIMPLIFIÉ: Fonction standalone au lieu de CloudinaryRealDeletionStrategy + CloudinaryNoOpStrategy
 */
async function deleteCloudinaryAssets(
  publicIds: string[],
  options: CloudinaryDeletionOptions = {}
): Promise<CloudinaryDeletionResult> {
  const startTime = Date.now()
  const invalidationRequested = options.invalidate !== false

  if (publicIds.length === 0) {
    console.log('⚠️ Aucun publicId Cloudinary à supprimer')
    return {
      totalAssets: 0,
      successCount: 0,
      failureCount: 0,
      invalidationRequested,
      failures: [],
      duration: Date.now() - startTime
    }
  }

  console.log(`🗑️ Début suppression Cloudinary: ${publicIds.length} assets (invalidate: ${invalidationRequested})`)

  const results: Array<{ publicId: string; success: boolean; error?: string }> = []

  // Suppression séquentielle pour éviter la surcharge de l'API Cloudinary
  for (const publicId of publicIds) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: invalidationRequested,
        resource_type: options.resource_type || 'image',
        type: options.type || 'upload'
      })

      const success = result.result === 'ok'
      results.push({
        publicId,
        success
      })

      if (success) {
        console.log(`✅ Asset Cloudinary supprimé: ${publicId}`)
      } else {
        console.warn(`⚠️ Échec suppression Cloudinary: ${publicId} - ${result.result}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        publicId,
        success: false,
        error: errorMessage
      })
      console.error(`❌ Erreur suppression Cloudinary: ${publicId}`, error)

      // Si skipOnError est false, on peut décider d'arrêter le processus
      if (!options.skipOnError) {
        // Pour l'instant, on continue même en cas d'erreur pour éviter de bloquer
        // la suppression des autres assets
      }
    }
  }

  // Calcul des métriques finales
  const successCount = results.filter(r => r.success).length
  const failureCount = results.length - successCount
  const failures = results
    .filter(r => !r.success)
    .map(r => ({ publicId: r.publicId, error: r.error || 'unknown' }))

  const duration = Date.now() - startTime

  // Logging des résultats avec métriques détaillées
  if (failureCount > 0) {
    const failureDetails = failures.map(f => `${f.publicId}: ${f.error}`).join(', ')
    console.warn(`⚠️ Suppression Cloudinary terminée: ${successCount}/${publicIds.length} réussies, ${failureCount} échecs`)
    console.warn(`📊 Détails des échecs: ${failureDetails}`)
  } else {
    console.log(`✅ Suppression Cloudinary terminée: ${successCount}/${publicIds.length} assets supprimés avec succès`)
  }

  console.log(`⏱️ Durée suppression Cloudinary: ${duration}ms`)

  if (invalidationRequested && successCount > 0) {
    console.log(`🔄 Invalidation CDN demandée pour ${successCount} assets - propagation en cours...`)
  }

  return {
    totalAssets: publicIds.length,
    successCount,
    failureCount,
    invalidationRequested,
    failures,
    duration
  }
}

/**
 * Supprime ou désactive une réalisation en base de données
 * ✅ SIMPLIFIÉ: Fonction standalone au lieu de SoftDeleteRealisationStrategy + HardDeleteRealisationStrategy
 */
async function deleteRealisationFromDB(
  db: Client,
  realisationId: string,
  source: string
): Promise<void> {
  if (source === 'cloudinary-auto-discovery') {
    // Soft delete pour auto-discovery
    await db.execute({
      sql: 'UPDATE realisations SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [realisationId]
    })
    console.log(`✅ Réalisation désactivée (soft delete): ${realisationId}`)
  } else {
    // Hard delete pour réalisations Turso
    await db.execute({
      sql: 'DELETE FROM realisations WHERE id = ?',
      args: [realisationId]
    })
    console.log(`✅ Réalisation supprimée (hard delete): ${realisationId}`)
  }
}

/**
 * Service principal pour gestion réalisations
 * ✅ SIMPLIFIÉ: Utilise fonctions simples au lieu de factories + strategies
 */
export class RealisationService {
  constructor(private db: Client) {}

  /**
   * Suppression orchestrée d'une réalisation (DB + Cloudinary optionnel)
   * Architecture simplifiée: logique conditionnelle claire
   */
  async deleteRealisation(
    realisationId: string,
    source: string,
    options: {
      deleteFromCloudinary?: boolean
      publicIds?: string[]
      invalidate?: boolean
    } = {}
  ): Promise<void> {
    const { deleteFromCloudinary = false, publicIds = [], invalidate = true } = options

    console.log(`🎨 Suppression réalisation ${realisationId} (source: ${source}, cloudinary: ${deleteFromCloudinary})`)

    // ========================================
    // PHASE 1: Suppression Cloudinary (avant DB pour récupération des publicIds)
    // ========================================
    if (deleteFromCloudinary && publicIds.length > 0) {
      console.log(`☁️ Phase 1: Suppression Cloudinary de ${publicIds.length} assets`)

      try {
        const result = await deleteCloudinaryAssets(publicIds, {
          invalidate,
          resource_type: 'image',
          skipOnError: false
        })

        console.log(`✅ Phase 1 terminée: Suppression Cloudinary`)
        console.log(`📊 Métriques Cloudinary: ${result.successCount}/${result.totalAssets} réussies, durée: ${result.duration}ms`)

        if (result.invalidationRequested) {
          console.log(`🔄 Invalidation CDN activée pour ${result.successCount} assets`)
        }

        if (result.failureCount > 0) {
          console.warn(`⚠️ ${result.failureCount} échecs Cloudinary:`, result.failures)
        }

      } catch (cloudinaryError) {
        console.error('❌ Erreur Phase 1 (Cloudinary):', cloudinaryError)

        // On continue avec la suppression DB même si Cloudinary échoue
        // Les assets orphelins pourront être nettoyés manuellement
        console.warn('⚠️ Poursuite de la suppression DB malgré l\'échec Cloudinary')
      }
    }

    // ========================================
    // PHASE 2: Suppression/Désactivation base de données
    // ========================================
    console.log(`💾 Phase 2: Traitement base de données (source: ${source})`)

    // Pour les réalisations auto-discovery, ajouter à la blacklist au lieu de supprimer de la DB
    if (source === 'cloudinary-auto-discovery') {
      console.log(`ℹ️ Réalisation auto-discovery: ${realisationId} - Ajout à la blacklist`)

      try {
        // Récupérer le public_id depuis realisationId pour auto-discovery
        const publicId = realisationId.startsWith('auto-') ? realisationId.substring(5) : realisationId

        // Ajouter à la blacklist pour éviter la re-découverte
        await this.addToBlacklist(
          publicId,
          `Auto-discovery supprimée: ${publicId}`,
          'user_deleted_auto_discovery',
          'admin'
        )

        console.log(`🚫 Ajouté à la blacklist: ${publicId}`)
      } catch (blacklistError) {
        console.error('❌ Erreur ajout blacklist:', blacklistError)
        throw blacklistError
      }

      if (deleteFromCloudinary) {
        console.log(`✅ Suppression complète de la réalisation auto-discovery: ${realisationId}`)
      } else {
        console.log(`✅ Réalisation auto-discovery blacklistée: ${realisationId}`)
      }
      return
    }

    // Pour les réalisations Turso, appliquer la logique DB appropriée
    try {
      await deleteRealisationFromDB(this.db, realisationId, source)
      console.log(`✅ Phase 2 terminée: Suppression DB`)
    } catch (dbError) {
      console.error('❌ Erreur Phase 2 (DB):', dbError)
      throw dbError // On throw l'erreur DB car c'est critique
    }

    console.log(`🎉 Suppression orchestrée terminée: ${realisationId}`)
  }

  /**
   * Ajouter une réalisation à la blacklist pour éviter sa re-découverte automatique
   * Utilisé principalement pour les réalisations auto-discovery supprimées
   */
  async addToBlacklist(
    publicId: string,
    originalTitle?: string,
    reason: string = 'user_deleted',
    blacklistedBy: string = 'admin'
  ): Promise<void> {
    try {
      console.log(`🚫 Ajout à la blacklist: ${publicId}`)

      await this.db.execute({
        sql: `INSERT OR REPLACE INTO realisation_blacklist
        (public_id, original_title, reason, blacklisted_by, blacklisted_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [publicId, originalTitle, reason, blacklistedBy]
      })

      console.log(`✅ Blacklist mise à jour: ${publicId}`)
    } catch (error) {
      console.error('❌ Erreur ajout blacklist:', error)
      throw error
    }
  }

  /**
   * Retirer une réalisation de la blacklist
   */
  async removeFromBlacklist(publicId: string): Promise<void> {
    try {
      console.log(`🔓 Retrait de la blacklist: ${publicId}`)

      const result = await this.db.execute({
        sql: 'DELETE FROM realisation_blacklist WHERE public_id = ?',
        args: [publicId]
      })

      if (result.rowsAffected > 0) {
        console.log(`✅ Retiré de la blacklist: ${publicId}`)
      } else {
        console.log(`ℹ️ Non trouvé dans la blacklist: ${publicId}`)
      }
    } catch (error) {
      console.error('❌ Erreur retrait blacklist:', error)
      throw error
    }
  }

  /**
   * Obtenir la liste des éléments blacklistés
   */
  async getBlacklistedItems(): Promise<any[]> {
    try {
      const result = await this.db.execute({
        sql: `SELECT public_id, original_title, reason, blacklisted_at, blacklisted_by
        FROM realisation_blacklist
        ORDER BY blacklisted_at DESC`,
        args: []
      })

      return result.rows || []
    } catch (error) {
      console.error('❌ Erreur récupération blacklist:', error)
      throw error
    }
  }
}
