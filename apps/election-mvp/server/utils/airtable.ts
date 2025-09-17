/**
 * Utilitaires pour l'API Airtable
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.warn('⚠️ Configuration Airtable manquante - les synchronisations ne fonctionneront pas')
}

interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime: string
}

interface AirtableResponse {
  records: AirtableRecord[]
  offset?: string
}

/**
 * Récupère les enregistrements d'une table Airtable
 */
export async function fetchAirtableRecords(
  tableName: string,
  options: {
    maxRecords?: number
    view?: string
    filterByFormula?: string
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  } = {}
): Promise<AirtableRecord[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Configuration Airtable manquante')
  }

  const { maxRecords = 100, view, filterByFormula, sort } = options

  try {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`)

    // Paramètres de requête
    const params = new URLSearchParams()

    if (maxRecords) {
      params.append('maxRecords', maxRecords.toString())
    }

    if (view) {
      params.append('view', view)
    }

    if (filterByFormula) {
      params.append('filterByFormula', filterByFormula)
    }

    if (sort && sort.length > 0) {
      sort.forEach((sortItem, index) => {
        params.append(`sort[${index}][field]`, sortItem.field)
        params.append(`sort[${index}][direction]`, sortItem.direction)
      })
    }

    url.search = params.toString()

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur Airtable: ${response.status} ${response.statusText}`)
    }

    const data: AirtableResponse = await response.json()

    console.log(`✅ Récupéré ${data.records.length} enregistrements de ${tableName}`)

    return data.records

  } catch (error) {
    console.error(`❌ Erreur récupération Airtable ${tableName}:`, error)
    throw error
  }
}

/**
 * Récupère un enregistrement spécifique par ID
 */
export async function fetchAirtableRecord(
  tableName: string,
  recordId: string
): Promise<AirtableRecord> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Configuration Airtable manquante')
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}/${recordId}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur Airtable: ${response.status} ${response.statusText}`)
    }

    const record: AirtableRecord = await response.json()

    console.log(`✅ Récupéré enregistrement ${recordId} de ${tableName}`)

    return record

  } catch (error) {
    console.error(`❌ Erreur récupération enregistrement ${recordId} de ${tableName}:`, error)
    throw error
  }
}

/**
 * Teste la connexion à Airtable
 */
export async function testAirtableConnection(): Promise<{
  success: boolean
  error?: string
  responseTime?: number
}> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return {
      success: false,
      error: 'Configuration Airtable manquante'
    }
  }

  const startTime = Date.now()

  try {
    // Test simple avec une requête minimale
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Produits?maxRecords=1`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        success: false,
        error: `Erreur ${response.status}: ${response.statusText}`,
        responseTime
      }
    }

    return {
      success: true,
      responseTime
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      responseTime: Date.now() - startTime
    }
  }
}

/**
 * Récupère les métadonnées d'une base Airtable
 */
export async function fetchAirtableBaseMetadata(): Promise<{
  tables: Array<{
    id: string
    name: string
    description?: string
  }>
}> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Configuration Airtable manquante')
  }

  try {
    const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur Airtable Meta: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    console.log(`✅ Récupéré métadonnées base ${AIRTABLE_BASE_ID}`)

    return data

  } catch (error) {
    console.error(`❌ Erreur récupération métadonnées:`, error)
    throw error
  }
}

/**
 * Utilitaire pour mapper les champs Airtable vers notre schéma
 */
export function mapAirtableProduct(record: AirtableRecord) {
  return {
    id: record.id,
    airtable_id: record.id,
    name: record.fields.Name || '',
    reference: record.fields.Reference || '',
    description: record.fields.Description || '',
    category_id: record.fields.Category?.[0] || null,
    price: Number(record.fields.Price) || 0,
    image_url: record.fields.Image?.[0]?.url || null,
    is_active: record.fields.Active !== false,
    is_featured: record.fields.Featured === true,
    stock_status: record.fields.Stock || 'available',
    min_quantity: Number(record.fields.MinQuantity) || 1,
    max_quantity: Number(record.fields.MaxQuantity) || 1000,
    tags: record.fields.Tags || [],
    created_at: record.createdTime,
    updated_at: new Date().toISOString()
  }
}

/**
 * Utilitaire pour mapper les bundles Airtable
 */
export function mapAirtableBundle(record: AirtableRecord) {
  return {
    id: record.id,
    airtable_id: record.id,
    name: record.fields.Name || '',
    description: record.fields.Description || '',
    target_audience: record.fields.TargetAudience || 'universal',
    budget_range: record.fields.BudgetRange || 'medium',
    estimated_total: Number(record.fields.EstimatedTotal) || 0,
    original_total: Number(record.fields.OriginalTotal) || 0,
    savings: Number(record.fields.Savings) || 0,
    popularity: Number(record.fields.Popularity) || 5,
    is_active: record.fields.Active !== false,
    is_featured: record.fields.Featured === true,
    tags: record.fields.Tags || [],
    created_at: record.createdTime,
    updated_at: new Date().toISOString()
  }
}

/**
 * Utilitaire pour mapper les catégories Airtable
 */
export function mapAirtableCategory(record: AirtableRecord) {
  return {
    id: record.id,
    airtable_id: record.id,
    name: record.fields.Name || '',
    description: record.fields.Description || '',
    slug: record.fields.Slug || record.fields.Name?.toLowerCase().replace(/\s+/g, '-') || '',
    is_active: record.fields.Active !== false,
    created_at: record.createdTime,
    updated_at: new Date().toISOString()
  }
}