# Architecture Technique NS2PO

## Stack Principal

### Frontend
- **Framework** : Nuxt.js 3 + Vue.js 3
- **TypeScript** : Strict mode activé
- **Styling** : Tailwind CSS + HeadlessUI
- **State** : Composables Vue natifs

### Backend
- **API** : API Routes Nuxt (Nitro)
- **Database** : Turso (SQLite Edge)
- **CMS** : Airtable (catalogue produits)

### Infrastructure
- **Médias** : Cloudinary (images/logos)
- **Déploiement** : Vercel Edge
- **Monorepo** : Turborepo + pnpm workspaces
- **CI/CD** : GitHub Actions + SonarCloud

## Structure des Dossiers

```
ns2po-monorepo/
├── apps/
│   └── election-mvp/          # Application Nuxt principale
├── packages/
│   ├── ui/                    # Composants Vue partagés
│   ├── types/                 # Types TypeScript
│   ├── config/                # Configurations ESLint/Prettier
│   └── composables/           # Hooks Vue réutilisables
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Intégrations Externes

### Airtable (Catalogue)
```typescript
// Configuration de base
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
const base = airtable.base('appXXXXXXXXXXXXXX')

// Tables principales
- Products: Catalogue complet
- Categories: Classification
- PriceRules: Règles de tarification
- CampaignBundles: Packs électoraux
- BundleProducts: Produits des packs
```

### Cloudinary (Médias)
```typescript
// Upload et transformation
import { v2 as cloudinary } from 'cloudinary'

// Transformations automatiques
- f_auto,q_auto: Format et qualité optimisés
- w_500,h_500,c_fill: Redimensionnement uniforme
```

### Turso (Base de données)
```sql
-- Tables principales
CREATE TABLE quotes (
  id INTEGER PRIMARY KEY,
  customer_data JSON,
  products JSON,
  total_amount REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY,
  type TEXT CHECK(type IN ('quote', 'preorder', 'custom')),
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Technologies Clés

- **Turborepo Remote Caching** : Build incrémentaux rapides
- **Vercel Edge Functions** : APIs performantes
- **Drizzle ORM + Turso** : Base de données typée
- **Headless CMS** : Airtable comme backend
- **Nuxt 3 Data Fetching** : useFetch, useAsyncData