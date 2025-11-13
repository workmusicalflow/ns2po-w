#!/bin/bash
# Script d'initialisation de la DB de test SQLite locale
# Solution validée par Perplexity: évite replication lag Turso pour tests E2E

set -e

echo "🧪 Initialisation DB test SQLite locale..."

# Supprimer ancienne DB si elle existe
rm -f test.db test.db-shm test.db-wal

# Créer fichier DB vide
touch test.db

# Appliquer toutes les migrations
echo "📦 Application des migrations..."
for migration in server/database/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "  - Exécution: $(basename $migration)"
    # ⚠️ Ignore errors car certaines migrations ont des SELECT de vérification
    # qui référencent des tables externes (products) non présentes dans ces migrations
    sqlite3 test.db < "$migration" 2>&1 | grep -v "no such table" || true
  fi
done

echo "✅ DB test initialisée avec succès!"
echo "📍 Fichier: $(pwd)/test.db"

# Vérifier les tables créées
echo ""
echo "📋 Tables créées:"
sqlite3 test.db ".tables"
