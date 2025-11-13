import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

// Vérifier les bundles 191-196 créés par les tests
const result = await db.execute(`
  SELECT 
    cb.id as bundle_id,
    cb.name as bundle_name,
    bp.product_id,
    bp.custom_price,
    bp.price_locked,
    p.base_price as catalog_price,
    p.name as product_name,
    CASE
      WHEN bp.price_locked = 1 THEN bp.custom_price
      ELSE p.base_price
    END as resolved_price
  FROM campaign_bundles cb
  LEFT JOIN bundle_products bp ON cb.id = bp.bundle_id
  LEFT JOIN products p ON bp.product_id = p.id
  WHERE cb.id >= 191 AND cb.id <= 196
  ORDER BY cb.id ASC
`)

console.log(`🔍 Bundles 191-196 (tests récents):\n`)
result.rows.forEach(row => {
  console.log(`Bundle ${row.bundle_id} (${row.bundle_name}):`)
  console.log(`  Product: ${row.product_id} (${row.product_name})`)
  console.log(`  Custom Price: ${row.custom_price}, Locked: ${row.price_locked}`)
  console.log(`  Catalog Price: ${row.catalog_price}`)
  console.log(`  ✅ Resolved Price: ${row.resolved_price} FCFA`)
  console.log()
})

process.exit(0)
