import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

// Vérifier bundle 212 IMMÉDIATEMENT après création
console.log('🔍 Vérification bundle 212...\n')

// Check bundle
const bundleCheck = await db.execute({
  sql: 'SELECT id, name, is_active, created_at FROM campaign_bundles WHERE id = 212'
})

console.log('📦 Bundle 212:', bundleCheck.rows.length > 0 ? bundleCheck.rows[0] : 'NOT FOUND')

// Check products
const productsCheck = await db.execute({
  sql: `SELECT
    bp.bundle_id,
    bp.product_id,
    bp.custom_price,
    bp.price_locked,
    bp.quantity,
    bp.created_at as bp_created,
    p.name as product_name
  FROM bundle_products bp
  LEFT JOIN products p ON bp.product_id = p.id
  WHERE bp.bundle_id = 212`
})

console.log(`\n🔍 Produits du bundle 212: ${productsCheck.rows.length}`)
if (productsCheck.rows.length > 0) {
  productsCheck.rows.forEach(row => {
    console.log('  -', JSON.stringify(row, null, 2))
  })
} else {
  console.log('  ❌ AUCUN PRODUIT TROUVÉ!')
}

// Check ALL recent bundles to see pattern
const recentBundles = await db.execute({
  sql: `SELECT
    cb.id,
    cb.name,
    cb.is_active,
    COUNT(bp.product_id) as product_count,
    cb.created_at
  FROM campaign_bundles cb
  LEFT JOIN bundle_products bp ON cb.id = bp.bundle_id
  WHERE cb.id >= 200
  GROUP BY cb.id
  ORDER BY cb.id DESC
  LIMIT 15`
})

console.log('\n🔍 Recent bundles (≥200):')
recentBundles.rows.forEach(row => {
  console.log(`  Bundle ${row.id} (active=${row.is_active}): ${row.product_count} produits - ${row.name}`)
})

process.exit(0)
