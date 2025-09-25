/**
 * API Route: GET /api/admin/cloudinary-stats
 * Récupère les statistiques Cloudinary spécifiques au projet NS2PO
 */

export default defineEventHandler(async (event) => {
  try {
    const cloudinaryCloudName = useRuntimeConfig().cloudinaryCloudName

    if (!cloudinaryCloudName) {
      throw new Error('Cloudinary configuration not available')
    }

    // Import dynamique de cloudinary pour éviter les erreurs SSR
    const { v2: cloudinary } = await import('cloudinary')

    // Configuration Cloudinary
    cloudinary.config({
      cloud_name: useRuntimeConfig().cloudinaryCloudName,
      api_key: useRuntimeConfig().cloudinaryApiKey,
      api_secret: useRuntimeConfig().cloudinaryApiSecret,
    })

    const startTime = Date.now()

    // 1. Statistiques générales du folder NS2PO
    const ns2poStats = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ns2po/', // Images spécifiques au projet NS2PO
      max_results: 500,
      resource_type: 'image'
    })

    // 2. Statistiques par sous-dossiers NS2PO
    const folderBreakdown = {}
    let totalSize = 0

    ns2poStats.resources.forEach((resource: any) => {
      // Extraire le sous-dossier (ex: ns2po/gallery/creative -> gallery/creative)
      const pathParts = resource.public_id.split('/')
      if (pathParts.length > 1) {
        const subFolder = pathParts.slice(1, -1).join('/') || 'root'
        folderBreakdown[subFolder] = (folderBreakdown[subFolder] || 0) + 1
      }
      totalSize += resource.bytes || 0
    })

    // 3. Formats d'images
    const formatStats = {}
    ns2poStats.resources.forEach((resource: any) => {
      const format = resource.format || 'unknown'
      formatStats[format] = (formatStats[format] || 0) + 1
    })

    // 4. Images récentes (derniers 7 jours)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const recentImages = ns2poStats.resources.filter((resource: any) => {
      return new Date(resource.created_at) > oneWeekAgo
    })

    const stats = {
      success: true,
      connection: {
        status: 'connected',
        healthy: true,
        lastCheck: new Date().toISOString(),
        cloudName: cloudinaryCloudName
      },
      project: {
        totalImages: ns2poStats.resources.length,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        recentImages: recentImages.length,
        folderBreakdown,
        formatStats
      },
      performance: {
        responseTime: Date.now() - startTime,
        apiCallsUsed: 1
      },
      quota: {
        // Ces valeurs seraient idéalement récupérées de l'API Cloudinary Admin
        used: ns2poStats.resources.length,
        limit: 'Unlimited', // Dépend du plan Cloudinary
        percentage: 'N/A'
      }
    }

    // Headers de cache - plus court pour les stats en temps réel
    setHeader(event, "Cache-Control", "public, max-age=300") // 5 minutes

    return stats

  } catch (error) {
    console.error("❌ Erreur récupération stats Cloudinary:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne",
      connection: {
        status: 'disconnected',
        healthy: false,
        lastCheck: new Date().toISOString(),
        cloudName: 'unknown'
      },
      project: {
        totalImages: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        recentImages: 0,
        folderBreakdown: {},
        formatStats: {}
      },
      performance: {
        responseTime: 0,
        apiCallsUsed: 0
      }
    }
  }
})