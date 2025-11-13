#!/bin/bash

# Fix TypeScript TS2558: $fetch<Type>(...) → $fetch(...) as Type
# Sprint 5 - Automated TypeScript Fixes

cd "$(dirname "$0")/.." || exit 1

echo "🔧 Fixing TypeScript $fetch<> errors..."

# Fichiers à corriger
FILES=(
  "apps/election-mvp/repositories/ProductRepository.ts"
  "apps/election-mvp/services/BundleService.ts"
  "apps/election-mvp/composables/useProductsQuery.ts"
  "apps/election-mvp/composables/useAssetsQuery.ts"
  "apps/election-mvp/pages/admin/products/[id].vue"
  "apps/election-mvp/composables/useProductBundlesQuery.ts"
  "apps/election-mvp/composables/useCloudinaryMetadata.ts"
  "apps/election-mvp/composables/useCategoryMutations.ts"
  "apps/election-mvp/composables/useCategoriesQuery.ts"
  "apps/election-mvp/pages/admin/bundles/new.vue"
  "apps/election-mvp/composables/useProductReferenceValidation.ts"
  "apps/election-mvp/components/admin/AssetReplaceModal.vue"
  "apps/election-mvp/components/admin/AssetDeleteModal.vue"
  "apps/election-mvp/pages/admin/blacklist.vue"
  "apps/election-mvp/composables/useQuoteItems.ts"
  "apps/election-mvp/composables/useContacts.ts"
  "apps/election-mvp/composables/useCloudinary.ts"
  "apps/election-mvp/components/CloudinaryUpload.vue"
)

FIXED_COUNT=0

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️ File not found: $file"
    continue
  fi

  # Backup
  cp "$file" "$file.bak"

  # Pattern: $fetch<TYPE>(URL, { → $fetch(URL, { ... }) as TYPE
  # Utilise perl pour meilleure regex multiligne
  perl -0777 -i -pe 's/\$fetch<([^>]+)>\(([^,]+),\s*\{([^}]*)\}\)/\$fetch($2, {$3}) as $1/g' "$file"

  # Vérifier si le fichier a changé
  if ! diff "$file" "$file.bak" > /dev/null 2>&1; then
    ((FIXED_COUNT++))
    echo "✅ Fixed: $file"
  else
    echo "⏭️ No changes: $file"
  fi

  # Garder backup temporaire
done

echo ""
echo "✅ Fixed $FIXED_COUNT files"
echo "📋 Backups created with .bak extension"
echo ""
echo "Run 'pnpm type-check' to verify fixes"
