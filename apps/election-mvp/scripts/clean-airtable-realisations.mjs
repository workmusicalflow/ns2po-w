#!/usr/bin/env node

/**
 * Script de nettoyage Airtable - Solution d'experts améliorée
 * 
 * Ce script élimine le mapping en dur dans le code en nettoyant directement Airtable.
 * Après exécution, Airtable devient un vrai CMS où modifier une image = changer du texte !
 * 
 * Version améliorée avec :
 * - Airtable library officielle
 * - Native fetch Node.js 18+
 * - Mode dry-run pour tests sécurisés
 * - Gestion d'erreurs robuste
 */

import 'dotenv/config'
import Airtable from 'airtable'

// Configuration Airtable
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'apprQLdnVwlbfnioT'
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY

// Mapping des IDs fictifs vers les vraies URLs Cloudinary
const FICTIONAL_TO_REAL_MAPPING = {
  // Mappings originaux
  'realisation_jeunesse_kit': 'ns2po/gallery/creative/gobelet-001',
  'realisation_textile_campagne': 'ns2po/gallery/creative/tee-shirt-001',
  'realisation_casquettes_parti': 'ns2po/gallery/creative/casquette-001',
  'realisation_polo_executif': 'ns2po/gallery/creative/polo-001',
  'realisation_accessoires_meeting': 'ns2po/gallery/creative/sac-001',
  'realisation_communication_visuelle': 'ns2po/gallery/creative/affiche-001',
  'realisation_objets_promotionnels': 'ns2po/gallery/creative/bracelet-001',
  'realisation_evenementiel': 'ns2po/gallery/creative/banderole-001',
  
  // Mappings présidentiels
  'realisation_presidentielle_hero': 'ns2po/gallery/creative/tee-shirt-001',
  'realisation_presidentielle_textiles': 'ns2po/gallery/creative/polo-001',
  'realisation_presidentielle_gadgets': 'ns2po/gallery/creative/gobelet-001',
  'realisation_presidentielle_equipe': 'ns2po/gallery/creative/casquette-001',
  
  // Mappings supplémentaires
  'realisation_municipale_kit': 'ns2po/gallery/creative/sac-001',
  'realisation_legislative_pack': 'ns2po/gallery/creative/affiche-001',
  'realisation_meeting_equipements': 'ns2po/gallery/creative/parapluie-001',
  'realisation_campagne_textile': 'ns2po/gallery/creative/tee-shirt-001',
  
  // Mappings des erreurs NS_BINDING_ABORTED
  'realisation_corporate_event': 'ns2po/gallery/creative/bracelet-001',
  'realisation_municipale_wax': 'ns2po/gallery/creative/banderole-001',
  'realisation_corporate_goodies': 'ns2po/gallery/creative/bracelet-001',
  'realisation_corporate_tenues': 'ns2po/gallery/creative/polo-001',
  'realisation_jeunesse_accessoires': 'ns2po/gallery/creative/casquette-001',
  'realisation_jeunesse_couleurs': 'ns2po/gallery/creative/tee-shirt-001',
  'realisation_municipale_artisanat': 'ns2po/gallery/creative/sac-001',
  'realisation_municipale_culture': 'ns2po/gallery/creative/affiche-001'
}

// Configuration du client Airtable
let base
try {
  Airtable.configure({
    apiKey: AIRTABLE_API_KEY
  })
  base = Airtable.base(AIRTABLE_BASE_ID)
} catch (error) {
  console.error('❌ Erreur de configuration Airtable:', error.message)
  process.exit(1)
}

/**
 * Récupère toutes les réalisations depuis Airtable
 */
async function fetchAllRealisations() {
  const records = []
  
  return new Promise((resolve, reject) => {
    base('Realisations')
      .select({
        // Pas de filtre - récupérer tous les records
        maxRecords: 100, // Sécurité pour éviter les boucles infinies
        view: 'Grid view' // Vue par défaut
      })
      .eachPage(
        function page(partialRecords, fetchNextPage) {
          records.push(...partialRecords)
          fetchNextPage()
        },
        function done(err) {
          if (err) {
            reject(err)
          } else {
            resolve(records)
          }
        }
      )
  })
}

/**
 * Met à jour une réalisation avec les nouvelles URLs Cloudinary
 */
async function updateRealisation(recordId, newCloudinaryIds, dryRun = false) {
  if (dryRun) {
    console.log(`    🧪 [DRY-RUN] Mise à jour simulée pour ${recordId}`)
    return { success: true, dryRun: true }
  }

  try {
    const updatedRecord = await base('Realisations').update(recordId, {
      'CloudinaryPublicIds': newCloudinaryIds.join(',')
    })
    
    return { success: true, record: updatedRecord }
  } catch (error) {
    console.error(`❌ Erreur mise à jour ${recordId}:`, error.message)
    throw error
  }
}

/**
 * Nettoie les IDs fictifs d'une liste
 */
function cleanCloudinaryIds(cloudinaryIdsString) {
  if (!cloudinaryIdsString) return { cleanedIds: [], hasChanges: false }
  
  const ids = cloudinaryIdsString.split(',').map(id => id.trim()).filter(id => id.length > 0)
  const cleanedIds = []
  let hasChanges = false
  
  for (const id of ids) {
    if (FICTIONAL_TO_REAL_MAPPING[id]) {
      cleanedIds.push(FICTIONAL_TO_REAL_MAPPING[id])
      hasChanges = true
      console.log(`    📝 ${id} → ${FICTIONAL_TO_REAL_MAPPING[id]}`)
    } else {
      cleanedIds.push(id)
    }
  }
  
  return { cleanedIds, hasChanges }
}

/**
 * Validation Cloudinary (optionnel)
 */
async function validateCloudinaryUrl(publicId) {
  const url = `https://res.cloudinary.com/dsrvzogof/image/upload/w_100,h_100,c_fill,f_auto,q_auto/${publicId}.jpg`
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Fonction principale
 */
async function main() {
  // Détection du mode dry-run
  const dryRun = process.argv.includes('--dry-run')
  const validate = process.argv.includes('--validate')
  
  console.log('🧹 Nettoyage Airtable - Élimination des IDs fictifs')
  console.log(dryRun ? '🧪 Mode DRY-RUN activé (aucune modification réelle)' : '🚀 Mode PRODUCTION - Modifications réelles')
  console.log('')
  
  if (!AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY non définie dans .env.local')
    process.exit(1)
  }

  try {
    // 1. Récupération de toutes les réalisations
    console.log('📥 Récupération des réalisations Airtable...')
    const realisations = await fetchAllRealisations()
    console.log(`✅ ${realisations.length} réalisations trouvées\n`)

    // 2. Analyse et nettoyage
    let updatedCount = 0
    let totalFictionalIds = 0
    const errors = []

    for (const realisation of realisations) {
      const { id, fields } = realisation
      const title = fields.Title || `Réalisation ${id.slice(-4)}`
      const cloudinaryIds = fields.CloudinaryPublicIds

      console.log(`🔍 Analyse: ${title}`)
      
      if (!cloudinaryIds) {
        console.log('    ⚠️  Pas d\'IDs Cloudinary\n')
        continue
      }

      const { cleanedIds, hasChanges } = cleanCloudinaryIds(cloudinaryIds)
      
      if (hasChanges) {
        console.log(`    🚀 Mise à jour ${dryRun ? 'simulée' : 'réelle'}...`)
        
        try {
          // Validation optionnelle des URLs Cloudinary
          if (validate) {
            console.log('    🔍 Validation des URLs Cloudinary...')
            for (const cleanedId of cleanedIds) {
              const isValid = await validateCloudinaryUrl(cleanedId)
              if (!isValid) {
                console.warn(`    ⚠️ URL potentiellement invalide: ${cleanedId}`)
              }
            }
          }
          
          await updateRealisation(id, cleanedIds, dryRun)
          updatedCount++
          console.log(`    ✅ ${dryRun ? 'Simulation' : 'Mise à jour'} réussie\n`)
          
          // Délai pour éviter le rate limiting
          if (!dryRun) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        } catch (error) {
          errors.push({ id, title, error: error.message })
          console.log(`    ❌ Erreur lors de la mise à jour\n`)
        }
      } else {
        console.log('    ✅ Déjà propre\n')
      }
    }

    // 3. Résumé
    console.log('📊 Résultats du nettoyage:')
    console.log(`   • ${updatedCount} réalisations ${dryRun ? 'à mettre à jour' : 'mises à jour'}`)
    console.log(`   • ${Object.keys(FICTIONAL_TO_REAL_MAPPING).length} mappings IDs fictifs disponibles`)
    
    if (errors.length > 0) {
      console.log(`   • ${errors.length} erreurs rencontrées`)
      console.log('\n❌ Erreurs détaillées:')
      errors.forEach(({ title, error }) => {
        console.log(`   - ${title}: ${error}`)
      })
    }
    
    if (dryRun) {
      console.log('\n🧪 DRY-RUN terminé. Pour exécuter réellement:')
      console.log('   node scripts/clean-airtable-realisations.mjs')
    } else {
      console.log('\n🎉 Airtable est maintenant un CMS pur !')
      console.log('   → Modification d\'image = Changement de texte dans Airtable')
      console.log('   → Plus besoin de toucher le code !')
    }

  } catch (error) {
    console.error('❌ Erreur pendant le nettoyage:', error.message)
    console.error('   Stack trace:', error.stack)
    process.exit(1)
  }
}

// Exécution avec gestion d'erreurs
main().catch(error => {
  console.error('💥 Erreur critique:', error.message)
  process.exit(1)
})