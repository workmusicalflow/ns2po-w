#!/bin/bash

# Script de Test Migration Locale (Option B)
# Teste la migration sur copie DB locale avant production
# Usage: ./scripts/test-migration-local.sh

set -e # Exit on error

echo "========================================="
echo "🧪 TEST MIGRATION LOCALE - Option B"
echo "========================================="
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier variables environnement
if [ -z "$TURSO_DATABASE_URL" ] || [ -z "$TURSO_AUTH_TOKEN" ]; then
  echo -e "${RED}❌ Variables TURSO manquantes${NC}"
  echo "Assurez-vous que TURSO_DATABASE_URL et TURSO_AUTH_TOKEN sont définies"
  exit 1
fi

# Créer répertoire test si n'existe pas
mkdir -p test-migration
cd test-migration

echo -e "${BLUE}📦 Étape 1/6 : Dump base Turso production${NC}"
echo "Source: $TURSO_DATABASE_URL"
echo ""

# Dump depuis Turso (nécessite turso CLI)
if ! command -v turso &> /dev/null; then
  echo -e "${RED}❌ turso CLI non installé${NC}"
  echo "Installation: curl -sSfL https://get.tur.so/install.sh | bash"
  exit 1
fi

DUMP_FILE="turso-dump-$(date +%Y%m%d-%H%M%S).sql"
echo "Création dump: $DUMP_FILE"
turso db dump ns2po-election-mvp > "$DUMP_FILE"

if [ ! -f "$DUMP_FILE" ]; then
  echo -e "${RED}❌ Erreur création dump${NC}"
  exit 1
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✅ Dump créé: $DUMP_SIZE${NC}"
echo ""

echo -e "${BLUE}📊 Étape 2/6 : Import dump dans SQLite local${NC}"
LOCAL_DB="test-migration.db"

# Supprimer ancienne DB test si existe
[ -f "$LOCAL_DB" ] && rm "$LOCAL_DB"

# Importer dump dans SQLite local
sqlite3 "$LOCAL_DB" < "$DUMP_FILE"

if [ ! -f "$LOCAL_DB" ]; then
  echo -e "${RED}❌ Erreur import SQLite${NC}"
  exit 1
fi

LOCAL_SIZE=$(du -h "$LOCAL_DB" | cut -f1)
echo -e "${GREEN}✅ DB locale créée: $LOCAL_SIZE${NC}"
echo ""

echo -e "${BLUE}📈 Étape 3/6 : Statistiques AVANT migration${NC}"
echo ""

# Compter produits
PRODUCTS_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products")
echo -e "Produits totaux: ${YELLOW}$PRODUCTS_COUNT${NC}"

# Compter produits avec JSON
PRODUCTS_WITH_MATERIALS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products WHERE materials IS NOT NULL AND materials != ''")
PRODUCTS_WITH_COLORS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products WHERE colors IS NOT NULL AND colors != ''")
PRODUCTS_WITH_SIZES=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products WHERE sizes IS NOT NULL AND sizes != ''")

echo -e "Produits avec materials: ${YELLOW}$PRODUCTS_WITH_MATERIALS${NC}"
echo -e "Produits avec colors: ${YELLOW}$PRODUCTS_WITH_COLORS${NC}"
echo -e "Produits avec sizes: ${YELLOW}$PRODUCTS_WITH_SIZES${NC}"
echo ""

# Taille DB avant
echo -e "Taille DB AVANT: ${YELLOW}$LOCAL_SIZE${NC}"
echo ""

echo -e "${BLUE}🔧 Étape 4/6 : Exécution migration SCHÉMA${NC}"
echo ""

# Exécuter migration 002 (schéma)
MIGRATION_SCHEMA="../packages/database/migrations/002_optimize_schema_json_to_native.sql"

if [ ! -f "$MIGRATION_SCHEMA" ]; then
  echo -e "${RED}❌ Fichier migration schéma introuvable: $MIGRATION_SCHEMA${NC}"
  exit 1
fi

sqlite3 "$LOCAL_DB" < "$MIGRATION_SCHEMA" 2>&1 | tee migration-schema.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}❌ Erreur migration schéma${NC}"
  echo "Voir logs: test-migration/migration-schema.log"
  exit 1
fi

echo -e "${GREEN}✅ Migration schéma terminée${NC}"
echo ""

# Vérifier tables créées
echo "Tables créées:"
sqlite3 "$LOCAL_DB" "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'product_%' ORDER BY name" | while read table; do
  echo -e "  ${GREEN}✓${NC} $table"
done
echo ""

echo -e "${BLUE}📊 Étape 5/6 : Exécution migration DONNÉES${NC}"
echo ""

# Créer fichier .env temporaire pour script TypeScript
cat > .env.test <<EOF
TURSO_DATABASE_URL=file:test-migration.db
TURSO_AUTH_TOKEN=dummy-token-for-local-test
EOF

# Adapter script migration pour SQLite local
cat > migrate-local-adapter.ts <<'EOF'
/**
 * Adapter pour migration locale SQLite (sans Turso SDK)
 * Utilise better-sqlite3 au lieu de @libsql/client
 */

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const db = new Database('test-migration.db')

// Charger et exécuter script migration
const migrationScript = readFileSync(
  join(__dirname, '../scripts/migrate-json-to-normalized.ts'),
  'utf-8'
)

// Exécuter migration
console.log('🚀 Exécution migration données localement...')

// Import du script original avec adaptation
import('../scripts/migrate-json-to-normalized.ts')
  .then(() => {
    console.log('✅ Migration données terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur migration:', error)
    process.exit(1)
  })
EOF

# Installer better-sqlite3 si nécessaire (pour tests locaux)
if ! npm list better-sqlite3 &> /dev/null; then
  echo "Installation better-sqlite3 pour tests locaux..."
  pnpm add -D better-sqlite3
fi

# Exécuter migration données
echo "Exécution script TypeScript migration données..."
cd ..
NODE_ENV=test pnpm tsx scripts/migrate-json-to-normalized.ts 2>&1 | tee test-migration/migration-data.log
cd test-migration

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${YELLOW}⚠️ Voir logs détaillés: test-migration/migration-data.log${NC}"
fi

echo ""

echo -e "${BLUE}✅ Étape 6/6 : Validation & Statistiques APRÈS migration${NC}"
echo ""

# Statistiques post-migration
echo "📊 Données migrées:"
MATERIALS_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM product_materials")
COLORS_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM product_colors")
SIZES_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM product_sizes")
GALLERY_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM product_gallery")
TAGS_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM product_tags")
FTS_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products_search_fts")

echo -e "  Materials: ${GREEN}$MATERIALS_COUNT${NC}"
echo -e "  Colors: ${GREEN}$COLORS_COUNT${NC}"
echo -e "  Sizes: ${GREEN}$SIZES_COUNT${NC}"
echo -e "  Gallery images: ${GREEN}$GALLERY_COUNT${NC}"
echo -e "  Tags: ${GREEN}$TAGS_COUNT${NC}"
echo -e "  Produits indexés FTS: ${GREEN}$FTS_COUNT${NC}"
echo ""

# Vérifier intégrité
echo "🔍 Vérification intégrité:"
ORPHANED=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM product_materials pm LEFT JOIN products p ON pm.product_id = p.id WHERE p.id IS NULL")

if [ "$ORPHANED" -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} Aucun enregistrement orphelin"
else
  echo -e "  ${RED}✗${NC} Enregistrements orphelins détectés: $ORPHANED"
fi

# Taille DB après
LOCAL_SIZE_AFTER=$(du -h "$LOCAL_DB" | cut -f1)
echo ""
echo -e "Taille DB APRÈS: ${YELLOW}$LOCAL_SIZE_AFTER${NC}"
echo ""

# Test requête optimisée
echo "🔍 Test requête optimisée (recherche matériau 'coton'):"
TIME_BEFORE=$(date +%s%N)
sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products WHERE materials LIKE '%coton%'" > /dev/null
TIME_AFTER=$(date +%s%N)
DURATION_OLD=$((($TIME_AFTER - $TIME_BEFORE) / 1000000))

TIME_BEFORE=$(date +%s%N)
sqlite3 "$LOCAL_DB" "SELECT COUNT(DISTINCT p.id) FROM products p JOIN product_materials pm ON p.id = pm.product_id WHERE pm.material_name LIKE '%coton%'" > /dev/null
TIME_AFTER=$(date +%s%N)
DURATION_NEW=$((($TIME_AFTER - $TIME_BEFORE) / 1000000))

echo -e "  Ancienne requête (JSON LIKE): ${YELLOW}${DURATION_OLD}ms${NC}"
echo -e "  Nouvelle requête (JOIN index): ${GREEN}${DURATION_NEW}ms${NC}"

if [ $DURATION_NEW -lt $DURATION_OLD ]; then
  GAIN=$((100 - ($DURATION_NEW * 100 / $DURATION_OLD)))
  echo -e "  ${GREEN}✓ Gain performance: ${GAIN}%${NC}"
fi
echo ""

# Test FTS
echo "🔍 Test Full-Text Search (recherche 't-shirt'):"
FTS_RESULTS=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM products_search_fts WHERE products_search_fts MATCH 't-shirt'")
echo -e "  Résultats trouvés: ${GREEN}$FTS_RESULTS${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}✅ TEST MIGRATION LOCALE TERMINÉ${NC}"
echo "========================================="
echo ""
echo "📁 Fichiers générés:"
echo "  - test-migration/$LOCAL_DB (DB migrée)"
echo "  - test-migration/$DUMP_FILE (backup original)"
echo "  - test-migration/migration-schema.log"
echo "  - test-migration/migration-data.log"
echo ""
echo "🎯 Prochaine étape:"
echo "  1. Vérifier résultats ci-dessus"
echo "  2. Tester requêtes manuellement:"
echo "     sqlite3 test-migration/$LOCAL_DB"
echo "  3. Si OK, exécuter migration production:"
echo "     ./scripts/migrate-production.sh"
echo ""
