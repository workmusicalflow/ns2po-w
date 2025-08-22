/**
 * API Route: Synchronisation des assets depuis Airtable
 * GET /api/admin/sync-assets
 */

interface AirtableAsset {
  id: string
  fields: {
    Status: string
    [key: string]: unknown
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Import dynamique pour éviter les problèmes de types
    const { getAssetsFromAirtable } = await import('../../../scripts/airtable-integration.mjs')
    
    // Récupérer les assets depuis Airtable
    const assets: AirtableAsset[] = await getAssetsFromAirtable()
    
    // Calculer des stats de synchronisation
    const stats = {
      total: assets.length,
      active: assets.filter((a: AirtableAsset) => a.fields.Status === '✅ Active').length,
      processing: assets.filter((a: AirtableAsset) => a.fields.Status === '🔄 Processing').length,
      draft: assets.filter((a: AirtableAsset) => a.fields.Status === '📄 Draft').length,
      archived: assets.filter((a: AirtableAsset) => a.fields.Status === '🗄 Archived').length,
      syncedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: {
        assets,
        stats
      },
      message: `${assets.length} assets synchronisés avec succès`,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: unknown) {
    console.error('❌ Erreur API sync-assets:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la synchronisation avec Airtable',
      data: {
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    })
  }
})