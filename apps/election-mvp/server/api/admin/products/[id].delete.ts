/**
 * API Route: DELETE /api/admin/products/[id]
 * Supprime un produit avec son schéma normalisé (relations + FTS5)
 * Query params:
 * - deleteImages=true: Supprime aussi les assets Cloudinary associés
 *
 * IMPORTANT: Utilise le schéma normalisé (product_materials, product_colors, product_sizes, product_gallery, products_fts)
 */

import { getDatabase } from "../../../utils/database"
import { assetService } from "../../../services/assetService"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const productId = getRouterParam(event, 'id')
    const query = getQuery(event)
    const deleteImages = query.deleteImages === 'true'

    console.log(`📦 DELETE /api/admin/products/${productId} - Suppression produit (schéma normalisé) ${deleteImages ? 'avec images' : 'sans images'}`)

    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du produit requis'
      })
    }

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le produit existe
    const existingProduct = await db.execute({
      sql: 'SELECT id, name FROM products WHERE id = ?',
      args: [productId]
    })

    if (existingProduct.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    const productName = existingProduct.rows[0].name as string

    try {
      // Vérifier si le produit est utilisé dans des bundles
      const bundleUsage = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM bundle_products WHERE product_id = ?',
        args: [productId]
      })

      const usageCount = bundleUsage.rows[0].count as number

      if (usageCount > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Impossible de supprimer le produit. Il est utilisé dans ${usageCount} bundle(s).`,
          data: {
            reason: 'product_in_use',
            bundleCount: usageCount
          }
        })
      }

      // Gestion des assets si deleteImages est activé
      let deletedAssets: string[] = []
      let assetsErrors: string[] = []

      if (deleteImages) {
        console.log('🖼️ Récupération des assets associés au produit...')

        try {
          const productAssets = await assetService.getAssetsByProduct(productId)
          const allAssets = []

          if (productAssets.mainImage) {
            allAssets.push(productAssets.mainImage)
          }

          if (productAssets.galleryImages.length > 0) {
            allAssets.push(...productAssets.galleryImages)
          }

          console.log(`🗑️ Suppression de ${allAssets.length} asset(s) associé(s)...`)

          // Supprimer chaque asset
          for (const asset of allAssets) {
            try {
              const deleteResult = await assetService.deleteAsset(asset.id)
              if (deleteResult.success) {
                deletedAssets.push(asset.id)
                console.log(`✅ Asset supprimé: ${asset.id} (${asset.public_id})`)
              } else {
                assetsErrors.push(`${asset.id}: échec de suppression`)
                console.warn(`⚠️ Échec suppression asset: ${asset.id}`)
              }
            } catch (assetError) {
              assetsErrors.push(`${asset.id}: ${assetError instanceof Error ? assetError.message : 'erreur inconnue'}`)
              console.error(`❌ Erreur suppression asset ${asset.id}:`, assetError)
            }
          }

        } catch (assetsRetrievalError) {
          console.warn('⚠️ Erreur lors de la récupération des assets:', assetsRetrievalError)
          assetsErrors.push('Erreur lors de la récupération des assets')
        }
      }

      // SCHÉMA NORMALISÉ: Suppression en cascade des relations
      console.log('🔗 Suppression des relations normalisées...')

      // Utiliser batch pour garantir l'atomicité
      const deleteStatements = [
        // 1. Supprimer materials
        {
          sql: 'DELETE FROM product_materials WHERE product_id = ?',
          args: [productId]
        },
        // 2. Supprimer colors
        {
          sql: 'DELETE FROM product_colors WHERE product_id = ?',
          args: [productId]
        },
        // 3. Supprimer sizes
        {
          sql: 'DELETE FROM product_sizes WHERE product_id = ?',
          args: [productId]
        },
        // 4. Supprimer gallery
        {
          sql: 'DELETE FROM product_gallery WHERE product_id = ?',
          args: [productId]
        },
        // 5. Supprimer FTS
        {
          sql: 'DELETE FROM products_fts WHERE product_id = ?',
          args: [productId]
        },
        // 6. Supprimer le produit principal
        {
          sql: 'DELETE FROM products WHERE id = ?',
          args: [productId]
        }
      ]

      await db.batch(deleteStatements, 'write')

      console.log(`✅ Produit et relations supprimés avec succès: ${productId} (${productName})`)

      // ⭐ INVALIDATION CACHE NITRO: Force le refetch de la liste produits
      try {
        await useStorage('cache').removeItem('products:list:active')
        console.log('🗑️ Cache Nitro invalidé après DELETE produit')
      } catch (cacheError) {
        console.warn('⚠️ Échec invalidation cache (non-bloquant):', cacheError)
      }

      const response = {
        success: true,
        message: `Produit "${productName}" supprimé avec succès${deleteImages ? ` avec ${deletedAssets.length} asset(s)` : ''}`,
        data: {
          id: productId,
          deletedAt: new Date().toISOString(),
          normalizedSchema: true,
          relationsDeleted: {
            materials: true,
            colors: true,
            sizes: true,
            gallery: true,
            fts: true
          },
          ...(deleteImages && {
            assets: {
              deleteRequested: true,
              deleted: deletedAssets,
              errors: assetsErrors,
              deletedCount: deletedAssets.length,
              errorCount: assetsErrors.length
            }
          })
        },
        source: 'turso-normalized',
        duration: Date.now() - startTime
      }

      // Cache headers
      setHeader(event, "Cache-Control", "no-cache")

      return response

    } catch (dbError: any) {
      console.error('❌ Erreur base de données:', dbError)

      // Si c'est une erreur de contrainte, la renvoyer telle quelle
      if (dbError.statusCode) {
        throw dbError
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du produit',
        data: { error: dbError.message }
      })
    }

  } catch (error: any) {
    console.error(`❌ Erreur DELETE /api/admin/products/${getRouterParam(event, 'id')}:`, error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})
