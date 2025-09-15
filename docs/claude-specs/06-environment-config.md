# Configuration et Variables d'Environnement

## Variables d'Environnement

```bash
# Airtable Configuration (existing)
AIRTABLE_API_KEY=patVeuzyzmUrECCbT.39608f70cb85b60236dacb42374b53d2442c4425d5204e136eed9d492075d833
AIRTABLE_BASE_ID=apprQLdnVwlbfnioT

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsrvzogof
CLOUDINARY_API_KEY=775318993136791
CLOUDINARY_API_SECRET=ywTgN-mioXQXW1lOWmq2xNAIK7U

# Turso
TURSO_DATABASE_URL=libsql://xxx.turso.io
TURSO_AUTH_TOKEN=XXXXXXXXXXXXXXXX

# SMTP (VALIDÉ)
SMTP_HOST=mail.topdigitalevel.site
SMTP_PORT=587
SMTP_USERNAME=info@topdigitalevel.site
SMTP_PASSWORD=undPzZ3x3U
SMTP_SECURE=tls
SMTP_AUTH=true
```

## Sécurité

### Validation des Données
```typescript
import { z } from "zod";

const QuoteSchema = z.object({
  customerName: z.string().min(2).max(100),
  email: z.string().email(),
  products: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().min(1).max(10000),
    })
  ),
});
```

### Protection CSRF
- **Tokens** automatiques dans les formulaires
- **SameSite cookies** configurés
- **Rate limiting** sur les APIs

## Maintenance et Mise à Jour

### Dépendances
```bash
# Mise à jour sécurisée
pnpm audit                    # Vérification vulnérabilités
pnpm update --latest         # Mise à jour packages
pnpm test                    # Tests après mise à jour
```

### Monitoring Production
- **Vercel Analytics** : Performance globale
- **Sentry** : Tracking des erreurs (à configurer)
- **Lighthouse** : Audit qualité

## Scripts de Maintenance

### Synchronisation Performance
```bash
# Scripts optimisés pour la sync Airtable ↔ Turso
node scripts/sync-performance.mjs <command>

# Commandes disponibles :
node scripts/sync-performance.mjs diff     # Sync différentielle (rapide)
node scripts/sync-performance.mjs full     # Sync complète
node scripts/sync-performance.mjs health   # État de santé de la sync
```

### Migration Campaign Bundles
```bash
# Migration des données vers Airtable
node scripts/migrate-campaign-bundles-to-airtable.mjs [--dry-run] [--clear-existing]

# Validation post-migration
node scripts/validate-campaign-bundles-migration.mjs

# Tests d'intégration
node scripts/test-campaign-bundles-integration.mjs [--verbose]
```

## Architecture de Données

- **Airtable** : Source de vérité (produits, catégories, règles prix)
- **Turso** : Cache performant + données métier (clients, commandes)
- **Cloudinary** : Assets optimisés avec transformations automatiques