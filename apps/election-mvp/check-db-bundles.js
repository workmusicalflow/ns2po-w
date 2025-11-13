import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

console.log('🔍 Checking for orphaned data...\n')

// 1. Liste des bundles actifs
const bundles = await db.execute('SELECT id, name, created_at FROM campaign_bundles WHERE is_active = 1 ORDER BY id DESC LIMIT 20')
console.log('📦 Active Bundles (last 20):')
bundles.rows.forEach(row => {
  console.log(`  ID: ${row.id}, Name: ${row.name}, Created: ${row.created_at}`)
})

// 2. Bundle_products orphelins
const orphans = await db.execute(`
  SELECT bp.*, p.base_price 
  FROM bundle_products bp
  LEFT JOIN campaign_bundles cb ON bp.bundle_id = cb.id
  LEFT JOIN products p ON bp.product_id = p.id
  WHERE cb.id IS NULL OR cb.is_active = 0
  ORDER BY bp.bundle_id DESC
  LIMIT 20
`)
console.log(`\n🧹 Orphaned bundle_products: ${orphans.rows.length}`)
orphans.rows.forEach(row => {
  console.log(`  Bundle ID: ${row.bundle_id}, Product: ${row.product_id}, Custom Price: ${row.custom_price}, Locked: ${row.price_locked}, Catalog Price: ${row.base_price}`)
})

// 3. Produits récents (pour voir les prix)
const products = await db.execute(`
  SELECT id, name, base_price, created_at 
  FROM products 
  WHERE name LIKE '%Test%' 
  ORDER BY created_at DESC 
  LIMIT 10
`)
console.log(`\n🛍️ Recent Test Products:`)
products.rows.forEach(row => {
  console.log(`  ID: ${row.id}, Name: ${row.name}, Price: ${row.base_price}, Created: ${row.created_at}`)
})

process.exit(0)
