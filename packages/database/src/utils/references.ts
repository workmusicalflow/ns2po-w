/**
 * Générateur de références uniques pour NS2PO
 */

export interface TrackingReference {
  full: string          // NS2PO-20250821-A4B2C6
  prefix: string        // NS2PO
  date: string          // 20250821
  code: string          // A4B2C6
  timestamp: number     // Pour tri/recherche
}

/**
 * Génère une référence de suivi unique
 */
export function generateTrackingReference(type: 'ORDER' | 'QUOTE' | 'CONTACT' = 'ORDER'): TrackingReference {
  const now = new Date()
  
  // Format date YYYYMMDD
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  
  // Code aléatoire 6 caractères (lettres + chiffres)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  const prefix = type === 'ORDER' ? 'NS2PO' : 
                 type === 'QUOTE' ? 'DEVIS' : 'CONTACT'
  
  const full = `${prefix}-${dateStr}-${code}`
  
  return {
    full,
    prefix,
    date: dateStr,
    code,
    timestamp: now.getTime()
  }
}

/**
 * Parse une référence de suivi
 */
export function parseTrackingReference(reference: string): TrackingReference | null {
  const pattern = /^(NS2PO|DEVIS|CONTACT)-(\d{8})-([A-Z0-9]{6})$/
  const match = reference.match(pattern)
  
  if (!match) return null
  
  const [, prefix, date, code] = match
  
  if (!prefix || !date || !code) return null
  
  // Reconstruct timestamp from date
  const year = parseInt(date.slice(0, 4))
  const month = parseInt(date.slice(4, 6)) - 1
  const day = parseInt(date.slice(6, 8))
  const timestamp = new Date(year, month, day).getTime()
  
  return {
    full: reference,
    prefix,
    date,
    code,
    timestamp
  }
}

/**
 * Valide une référence de suivi
 */
export function isValidTrackingReference(reference: string): boolean {
  return parseTrackingReference(reference) !== null
}

/**
 * Génère une URL de suivi
 */
export function generateTrackingUrl(reference: string, baseUrl = ''): string {
  return `${baseUrl}/suivi/${reference}`
}

/**
 * Formate une référence pour affichage (avec espaces)
 */
export function formatReferenceForDisplay(reference: string): string {
  const parsed = parseTrackingReference(reference)
  if (!parsed) return reference
  
  return `${parsed.prefix} - ${parsed.date} - ${parsed.code}`
}

/**
 * Génère des exemples de références pour tests
 */
export function generateSampleReferences(count = 5): TrackingReference[] {
  return Array.from({ length: count }, () => generateTrackingReference())
}