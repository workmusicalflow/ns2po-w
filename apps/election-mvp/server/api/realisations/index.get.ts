import type { AirtableRealisation, Realisation, Category, Product, CustomizationOption } from '@ns2po/types'

interface EnrichedRealisation extends Realisation {
  readonly cloudinaryUrls?: readonly string[]
}

const AIRTABLE_BASE_ID = 'apprQLdnVwlbfnioT'
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY

async function fetchAirtableData<T>(tableName: string, view?: string): Promise<T[]> {
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`)
  if (view) url.searchParams.set('view', view)

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Erreur Airtable ${tableName}: ${response.statusText}`
    })
  }

  const data = await response.json()
  return data.records || []
}

// Le mapping dur a été éliminé ! 
// Airtable contient maintenant les vraies URLs Cloudinary grâce au script de nettoyage
// Plus besoin de transformation - CMS pur !

function transformAirtableRealisation(airtableRealisation: AirtableRealisation): Realisation {
  const fields = airtableRealisation.fields
  
  // Plus de mapping nécessaire - Airtable contient les vraies URLs !
  const cloudinaryIds = fields.CloudinaryPublicIds ? fields.CloudinaryPublicIds.split(',').map(id => id.trim()) : []
  
  return {
    id: airtableRealisation.id,
    title: fields.Title || 'Sans titre', // Airtable uses 'Title' with capital T
    description: fields.Description,
    cloudinaryPublicIds: cloudinaryIds,
    productIds: fields.ProductIds || [],
    categoryIds: fields.CategoryIds || [],
    customizationOptionIds: fields.CustomizationOptionIds || [],
    tags: fields.Tags || [],
    isFeatured: fields.IsFeatured || false,
    order: fields.DisplayOrder,
    isActive: fields.IsActive !== false // Par défaut true
  }
}

function generateCloudinaryUrls(publicIds: readonly string[]): readonly string[] {
  return publicIds.map(publicId => {
    // Assurer que l'extension .jpg est présente pour les images mappées
    const fullPath = publicId.includes('/') && !publicId.includes('.') 
      ? `${publicId}.jpg` 
      : publicId
    
    // Transformations simplifiées et fiables
    return `https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fill,f_auto,q_auto/${fullPath}`
  })
}

export default defineEventHandler(async (event): Promise<EnrichedRealisation[]> => {
  try {
    // Récupération des réalisations depuis Airtable (sans filtre de vue)
    const airtableRealisations = await fetchAirtableData<AirtableRealisation>('Realisations')
    
    // Transformation des données
    const realisations = airtableRealisations
      .map(transformAirtableRealisation)
      .filter(r => r.isActive)
      .sort((a, b) => {
        // Tri par ordre puis par titre
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        if (a.order !== undefined) return -1
        if (b.order !== undefined) return 1
        return a.title.localeCompare(b.title)
      })

    // Enrichissement avec les URLs Cloudinary optimisées
    const enrichedRealisations: EnrichedRealisation[] = realisations.map(realisation => ({
      ...realisation,
      cloudinaryUrls: generateCloudinaryUrls(realisation.cloudinaryPublicIds)
    }))

    // Mise en cache pour 15 minutes
    setHeader(event, 'Cache-Control', 'public, max-age=900')
    
    return enrichedRealisations

  } catch (error) {
    console.error('Erreur lors de la récupération des réalisations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des réalisations'
    })
  }
})