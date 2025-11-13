import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

// Vérifier bundle 211 créé par test 3.1
const bundleCheck = await db.execute({
  sql: 'SELECT id, name, created_at FROM campaign_bundles WHERE id = 211'
})

console.log('🔍 Bundle 211:', bundleCheck.rows)

// Vérifier les produits du bundle 211
const productsCheck = await db.execute({
  sql: `SELECT
    bp.bundle_id,
    bp.product_id,
    bp.custom_price,
    bp.price_locked,
    bp.quantity,
    bp.created_at as bp_created,
    p.name as product_name,
    p.base_price as catalog_price
  FROM bundle_products bp
  LEFT JOIN products p ON bp.product_id = p.id
  WHERE bp.bundle_id = 211`
})

console.log(`\n🔍 Produits du bundle 211: ${productsCheck.rows.length}`)
productsCheck.rows.forEach(row => {
  console.log(JSON.stringify(row, null, 2))
})

// Vérifier ALL bundles avec leur count de produits
const allBundles = await db.execute({
  sql: `SELECT
    cb.id,
    cb.name,
    COUNT(bp.product_id) as product_count,
    cb.created_at
  FROM campaign_bundles cb
  LEFT JOIN bundle_products bp ON cb.id = bp.bundle_id
  WHERE cb.id >= 200
  GROUP BY cb.id
  ORDER BY cb.id DESC
  LIMIT 20`
})

console.log('\n🔍 Recent bundles (≥200):')
allBundles.rows.forEach(row => {
  console.log(`  Bundle ${row.id} (${row.name}): ${row.product_count} produits`)
})

process.exit(0)
