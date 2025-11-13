import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

// Vérifier les bundles avec prix 5500
const result = await db.execute(`
  SELECT 
    cb.id as bundle_id,
    cb.name as bundle_name,
    bp.product_id,
    bp.custom_price,
    bp.price_locked,
    p.base_price as catalog_price,
    CASE
      WHEN bp.price_locked = 1 THEN bp.custom_price
      ELSE p.base_price
    END as resolved_price
  FROM campaign_bundles cb
  LEFT JOIN bundle_products bp ON cb.id = bp.bundle_id
  LEFT JOIN products p ON bp.product_id = p.id
  WHERE cb.is_active = 1
    AND (bp.custom_price = 5500 OR p.base_price = 5500)
  ORDER BY cb.id DESC
  LIMIT 20
`)

console.log(`🔍 Bundles avec prix 5500 FCFA: ${result.rows.length}\n`)
result.rows.forEach(row => {
  console.log(`Bundle ${row.bundle_id} (${row.bundle_name}):`)
  console.log(`  Product: ${row.product_id}`)
  console.log(`  Custom Price: ${row.custom_price}, Locked: ${row.price_locked}`)
  console.log(`  Catalog Price: ${row.catalog_price}`)
  console.log(`  Resolved Price: ${row.resolved_price}`)
  console.log()
})

process.exit(0)
