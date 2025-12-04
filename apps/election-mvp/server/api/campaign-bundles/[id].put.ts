/**
 * API Route: PUT /api/campaign-bundles/[id]
 * Met à jour un campaign bundle existant avec la nouvelle structure Turso
 *
 * ⚠️ IMPORTANT: Utilise imports dynamiques pour éviter silent 500 errors
 * Solution validée: https://github.com/workmusicalflow/ns2po-w/PUT-HANDLER-500-RESOLUTION.md
 */

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const bundleId = getRouterParam(event, 'id')
    console.log(`📦 PUT /api/campaign-bundles/${bundleId}`)

    // ⚡ Dynamic imports (prevents module load-time failures)
    let getDatabase, campaignBundleUpdateSchema, validateBundleProducts, validateBundleTotal, validateBundleBusinessRules, validateFeaturedBundleLimit, broadcastSSEEvent, z

    try {
      const [dbModule, bundleSchemas, sseModule, zodModule] = await Promise.all([
        import("../../utils/database"),
        import("../../../schemas/bundle"),
        import('../sse'),
        import("zod")
      ])

      getDatabase = dbModule.getDatabase
      campaignBundleUpdateSchema = bundleSchemas.campaignBundleUpdateSchema
      validateBundleProducts = bundleSchemas.validateBundleProducts
      validateBundleTotal = bundleSchemas.validateBundleTotal
      validateBundleBusinessRules = bundleSchemas.validateBundleBusinessRules
      validateFeaturedBundleLimit = bundleSchemas.validateFeaturedBundleLimit
      broadcastSSEEvent = sseModule.broadcastSSEEvent
      z = zodModule.z
    } catch (error) {
      console.error('❌ Module import failed:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to load required modules',
        data: { error: error.message }
      })
    }

    if (!bundleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du bundle requis'
      })
    }

    // Récupération du body
    const body = await readBody(event)
    body.id = bundleId

    // Validation du schéma
    let validatedData
    try {
      validatedData = campaignBundleUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        console.error('❌ Erreurs de validation Zod:', JSON.stringify(formattedErrors, null, 2))

        throw createError({
          statusCode: 400,
          statusMessage: 'Données invalides',
          data: {
            errors: formattedErrors
          }
        })
      }
      throw error
    }

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le bundle existe et récupérer la version actuelle
    const existingBundle = await db.execute({
      sql: 'SELECT id, version FROM campaign_bundles WHERE id = ?',
      args: [bundleId]
    })

    if (existingBundle.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    }

    const currentVersion = Number(existingBundle.rows[0].version)

    // Optimistic locking: vérifier la version si fournie
    if (validatedData.version !== undefined) {
      if (validatedData.version !== currentVersion) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflit de version détecté',
          data: {
            error: 'Le bundle a été modifié par un autre utilisateur',
            currentVersion,
            providedVersion: validatedData.version
          }
        })
      }
    }

    // Validations métier si des produits sont fournis
    if (validatedData.products) {
      const productErrors = validateBundleProducts(validatedData.products)
      const totalErrors = validateBundleTotal(validatedData)
      const businessErrors = validateBundleBusinessRules(validatedData)

      let allErrors = [...productErrors, ...totalErrors, ...businessErrors]

      // Validation des bundles vedettes pour les mises à jour
      if (validatedData.isFeatured) {
        const featuredErrors = await validateFeaturedBundleLimit(validatedData, db, true)
        allErrors = [...allErrors, ...featuredErrors]
      }

      if (allErrors.length > 0) {
        console.error('❌ Erreurs de validation métier:', JSON.stringify(allErrors, null, 2))
        throw createError({
          statusCode: 400,
          statusMessage: 'Erreurs de validation métier',
          data: { errors: allErrors }
        })
      }
    }

    try {
      // Calculs automatiques
      let calculatedTotal = validatedData.estimatedTotal
      let discountPercentage = 0
      let basePrice = validatedData.originalTotal

      if (validatedData.products) {
        const productsTotal = validatedData.products.reduce((total, product) => total + product.subtotal, 0)
        calculatedTotal = productsTotal
        basePrice = validatedData.originalTotal || productsTotal
        discountPercentage = basePrice > 0 ? ((basePrice - calculatedTotal) / basePrice * 100) : 0
      }

      // Construire la requête UPDATE dynamiquement
      const updateFields = []
      const updateArgs = []

      if (validatedData.name !== undefined) {
        updateFields.push('name = ?')
        updateArgs.push(validatedData.name)
      }

      if (validatedData.description !== undefined) {
        updateFields.push('description = ?')
        updateArgs.push(validatedData.description)
      }

      if (validatedData.targetAudience !== undefined) {
        updateFields.push('target_audience = ?')
        updateArgs.push(validatedData.targetAudience)
      }

      if (basePrice !== undefined) {
        updateFields.push('base_price = ?')
        updateArgs.push(basePrice)
      }

      if (discountPercentage !== undefined) {
        updateFields.push('discount_percentage = ?')
        updateArgs.push(discountPercentage)
      }

      if (validatedData.isActive !== undefined) {
        updateFields.push('is_active = ?')
        updateArgs.push(validatedData.isActive ? 1 : 0)
      }

      if (validatedData.displayOrder !== undefined) {
        updateFields.push('display_order = ?')
        updateArgs.push(validatedData.displayOrder)
      }

      if (validatedData.icon !== undefined) {
        updateFields.push('icon = ?')
        updateArgs.push(validatedData.icon)
      }

      if (validatedData.color !== undefined) {
        updateFields.push('color = ?')
        updateArgs.push(validatedData.color)
      }

      if (validatedData.tags !== undefined) {
        updateFields.push('features = ?')
        updateArgs.push(JSON.stringify(validatedData.tags))
      }

      // Toujours mettre à jour updated_at et incrémenter la version
      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      updateFields.push('version = version + 1')

      if (updateFields.length > 2) { // Plus que juste updated_at et version
        updateArgs.push(bundleId) // Pour la clause WHERE
        const sql = `UPDATE campaign_bundles SET ${updateFields.join(', ')} WHERE id = ?`

        await db.execute({
          sql,
          args: updateArgs
        })
      }

      // Mettre à jour les produits si fournis
      if (validatedData.products) {
        console.log('--- Début de la mise à jour des produits du bundle ---')
        console.log('Bundle ID:', bundleId)
        console.log('Produits reçus:', validatedData.products.length, 'produits')

        // 🔧 VALIDATION PRÉALABLE ROBUSTE (recommandée par Gemini)
        // Extraire et valider TOUS les IDs de produits AVANT toute modification
        const productIds = []
        const invalidProducts = []

        console.log('🔍 Phase 1: Extraction et validation des IDs de produits...')
        for (let i = 0; i < validatedData.products.length; i++) {
          const product = validatedData.products[i]
          const productId = product.productId || product.id

          if (!productId) {
            invalidProducts.push({
              index: i + 1,
              product: product,
              error: 'ID de produit manquant (productId ou id)'
            })
            continue
          }

          productIds.push({
            id: productId,
            index: i + 1,
            product: product
          })
        }

        if (invalidProducts.length > 0) {
          console.error('❌ Produits sans ID valide:', invalidProducts)
          throw createError({
            statusCode: 400,
            statusMessage: 'Produits invalides détectés',
            data: {
              errors: invalidProducts.map(p => `Produit #${p.index}: ${p.error}`)
            }
          })
        }

        // Vérifier l'existence de TOUS les IDs en une seule requête
        console.log('🔍 Phase 2: Vérification de l\'existence des produits en base...')
        const uniqueIds = [...new Set(productIds.map(p => p.id))]

        try {
          const placeholders = uniqueIds.map(() => '?').join(',')
          const existingProducts = await db.execute({
            sql: `SELECT id FROM products WHERE id IN (${placeholders}) AND is_active = 1`,
            args: uniqueIds
          })

          const existingIds = new Set(existingProducts.rows.map(row => row.id))
          const missingIds = uniqueIds.filter(id => !existingIds.has(id))

          if (missingIds.length > 0) {
            console.error('❌ Produits introuvables dans la base:', missingIds)
            const affectedProducts = productIds
              .filter(p => missingIds.includes(p.id))
              .map(p => `Produit #${p.index}: "${p.id}"`)

            throw createError({
              statusCode: 400,
              statusMessage: 'Produits introuvables dans la base de données',
              data: {
                errors: affectedProducts,
                missingIds: missingIds,
                availableProducts: Array.from(existingIds)
              }
            })
          }

          console.log(`✅ Validation réussie: tous les ${uniqueIds.length} produits existent`)

        } catch (validationError) {
          if (validationError.statusCode) {
            throw validationError // Re-throw les erreurs createError
          }
          console.error('❌ Erreur lors de la validation des produits:', validationError)
          throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la validation des produits',
            data: { error: validationError?.message || 'Erreur de validation inconnue' }
          })
        }

        // 🔧 Phase 3: Modification des données (maintenant sûre)
        console.log('🔄 Phase 3: Suppression des anciens produits...')
        try {
          await db.execute({
            sql: 'DELETE FROM bundle_products WHERE bundle_id = ?',
            args: [bundleId]
          })
          console.log(`✅ Anciens produits du bundle ${bundleId} supprimés`)
        } catch (deleteError) {
          console.error('❌ Erreur lors de la suppression:', deleteError)
          throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la suppression des anciens produits',
            data: { error: deleteError.message }
          })
        }

        // Phase 4: Insertion des nouveaux produits
        console.log('🔄 Phase 4: Insertion des nouveaux produits...')
        for (let i = 0; i < productIds.length; i++) {
          const { id: productId, product } = productIds[i]

          try {
            await db.execute({
              sql: `INSERT INTO bundle_products (
                bundle_id, product_id, quantity, custom_price, is_required, display_order, price_locked
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              args: [
                bundleId,
                productId,
                product.quantity,
                // 💰 Utiliser customPrice si défini, sinon basePrice (fix bug 400)
                product.customPrice ?? product.basePrice,
                product.isRequired !== false ? 1 : 0,
                i + 1,
                product.priceLocked ? 1 : 0
              ]
            })
          } catch (insertError) {
            console.error(`❌ Erreur insertion produit ${productId}:`, insertError)
            // Rollback en supprimant les insertions partielles
            await db.execute({
              sql: 'DELETE FROM bundle_products WHERE bundle_id = ?',
              args: [bundleId]
            })
            throw createError({
              statusCode: 500,
              statusMessage: `Erreur lors de l'insertion du produit ${productId}`,
              data: { error: insertError.message, productId }
            })
          }
        }
        console.log('--- Fin de la mise à jour des produits du bundle ---')
      }

      console.log(`✅ Bundle mis à jour avec succès: ${bundleId}`)

      // Récupérer le bundle mis à jour avec ses produits
      const updatedBundleResult = await db.execute({
        sql: `SELECT
          cb.id, cb.name, cb.description, cb.target_audience as targetAudience,
          cb.base_price as basePrice, cb.discount_percentage as discountPercentage,
          cb.final_price as finalPrice, cb.is_active as isActive,
          cb.display_order as displayOrder, cb.icon, cb.color, cb.features,
          cb.version, cb.created_at as createdAt, cb.updated_at as updatedAt
        FROM campaign_bundles cb WHERE cb.id = ?`,
        args: [bundleId]
      })

      if (updatedBundleResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Bundle non trouvé après mise à jour'
        })
      }

      const bundleData = updatedBundleResult.rows[0]

      // Récupérer les produits associés avec customPrice et priceLocked
      const productsResult = await db.execute({
        sql: `
          SELECT
            bp.product_id, p.name as product_name,
            p.base_price as basePrice,
            bp.custom_price,
            bp.price_locked,
            bp.quantity,
            (COALESCE(bp.custom_price, p.base_price) * bp.quantity) as subtotal,
            bp.is_required,
            p.image_url
          FROM bundle_products bp
          LEFT JOIN products p ON bp.product_id = p.id
          WHERE bp.bundle_id = ?
          ORDER BY bp.display_order ASC
        `,
        args: [bundleId]
      })

      const products = productsResult.rows.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        basePrice: Number(row.basePrice) || 0,
        customPrice: row.custom_price ? Number(row.custom_price) : undefined,
        priceLocked: Boolean(row.price_locked),
        quantity: Number(row.quantity) || 1,
        subtotal: Number(row.subtotal) || 0,
        isRequired: Boolean(row.is_required),
        image_url: row.image_url || undefined
      }))

      // Calculer les totaux
      const estimatedTotal = Number(bundleData.finalPrice) || 0
      const originalTotal = products.reduce((sum: number, p: any) => sum + p.subtotal, 0)
      const savings = originalTotal - estimatedTotal

      const response = {
        success: true,
        data: {
          id: String(bundleData.id),
          name: bundleData.name,
          description: bundleData.description || '',
          targetAudience: bundleData.targetAudience,
          budgetRange: estimatedTotal < 20000 ? 'starter' : estimatedTotal < 50000 ? 'standard' : 'premium',
          products,
          estimatedTotal,
          originalTotal,
          savings: Math.max(0, savings),
          popularity: 90,
          isActive: Boolean(bundleData.isActive),
          isFeatured: bundleData.displayOrder <= 3,
          tags: bundleData.features ? JSON.parse(bundleData.features) : [],
          createdAt: bundleData.createdAt,
          updatedAt: bundleData.updatedAt,
          icon: bundleData.icon,
          color: bundleData.color,
          displayOrder: bundleData.displayOrder,
          discountPercentage: Number(bundleData.discountPercentage) || 0,
          version: Number(bundleData.version) || 1
        },
        duration: Date.now() - startTime
      }

      // Broadcast SSE event for real-time synchronization
      console.log('📡 Émission SSE pour bundle mis à jour:', bundleData.name)
      const broadcastResult = broadcastSSEEvent({
        type: 'bundle:updated',
        data: response.data,
        timestamp: Date.now()
      })
      console.log('📊 Résultat broadcast SSE bundle:', broadcastResult)

      return response

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    // 🔍 Capture détaillée pour debugging Playwright/Nitro silent 500
    console.error('❌ [PUT HANDLER CATCH] Error caught:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: error?.statusCode,
      type: typeof error,
      constructor: error?.constructor?.name
    })
    console.error(`❌ Erreur PUT /api/campaign-bundles/${getRouterParam(event, 'id')}:`, error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        errorType: error?.constructor?.name || typeof error,
        duration: Date.now() - startTime
      }
    })
  }
})