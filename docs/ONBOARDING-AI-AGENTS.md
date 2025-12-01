# NS2PO Election MVP - Document d'Onboarding pour Agents IA

> **Version:** 1.0.0
> **Date:** 2025-12-01
> **Contexte:** Document de référence pour Gemini Copilot, Perplexity Copilot, et autres agents IA

---

## 1. Présentation du Projet

### 1.1 Contexte Métier
**NS2PO** est une PMI ivoirienne de publicité par l'objet, active depuis 2011. L'entreprise se spécialise dans la fourniture de gadgets personnalisés pour les campagnes électorales et événements professionnels en Afrique de l'Ouest.

**Mission MVP :** Digitaliser l'offre NS2PO via une plateforme de génération de devis et précommande de gadgets personnalisés, optimisée pour les conditions réseau 3G en Côte d'Ivoire.

### 1.2 Objectifs Techniques
- **Performance Mobile 3G** : Latence < 500ms API, < 50ms recherche fuzzy
- **Type-Safety** : TypeScript strict mode obligatoire
- **Zéro Dette Technique** : Architecture clean, pas d'over-engineering
- **Edge-First** : Turso Database (SQLite distribué) pour latence minimale

---

## 2. Stack Technique

### 2.1 Architecture 3-Tiers

| Couche | Technologies | Responsabilités |
|--------|-------------|-----------------|
| **Frontend** | Nuxt 3, Vue 3 (Composition API), TypeScript, Tailwind CSS | UI, SSR/SSG, routing |
| **État** | TanStack Query (Vue Query), Pinia | Cache serveur, mutations optimistes |
| **Backend** | Nuxt API Routes, Nitro | CRUD, validation Zod, business logic |
| **Database** | Turso (libSQL/SQLite Edge) | Données structurées, réplication edge |
| **Médias** | Cloudinary SDK | Upload, optimisation images |
| **Déploiement** | Railway (Runtime V2), Turborepo | CI/CD, monitoring |

### 2.2 Structure Monorepo

```
ns2po-w/
├── apps/
│   └── election-mvp/          # Application Nuxt 3 principale
│       ├── components/        # Composants Vue (ui/, admin/, devis/)
│       ├── composables/       # Logique réutilisable (useProducts, useBundles...)
│       ├── pages/             # Routes Nuxt (/, /admin, /devis, /realisations)
│       ├── server/api/        # API Routes Nitro
│       ├── services/          # Services métier
│       └── stores/            # Pinia stores
├── packages/
│   ├── database/              # Client Turso + services (customers, orders)
│   ├── types/                 # Types TypeScript partagés
│   ├── composables/           # Composables partagés
│   ├── config/                # Configuration partagée
│   └── ui/                    # Composants UI partagés
└── docs/                      # Documentation
```

### 2.3 Dépendances Clés

| Package | Version | Usage |
|---------|---------|-------|
| `nuxt` | ^3.12.0 | Framework fullstack |
| `@tanstack/vue-query` | ^5.89.0 | Cache serveur, mutations |
| `@libsql/client` | ^0.15.12 | Client Turso |
| `zod` | ^3.24.0 | Validation schémas |
| `puppeteer` | ^24.29.1 | Génération PDF |
| `cloudinary` | ^2.7.0 | Gestion médias |
| `tailwindcss` | ^3.4.0 | Styling |

---

## 3. Domaines Fonctionnels

### 3.1 Catalogue Produits (`/api/products`)
- **Recherche fuzzy** : Algorithme Levenshtein + synonymes ivoiriens
- **Virtualisation** : TanStack Virtual pour listes longues
- **Cache** : TanStack Query avec stale time 5min

### 3.2 Campaign Bundles (`/api/campaign-bundles`)
- **CRUD complet** : GET, POST, PUT, DELETE
- **Structure** : Packs prédéfinis de produits pour campagnes
- **Audiences** : Jeunesse, Femmes, Générale, etc.

### 3.3 Réalisations (`/api/realisations`)
- **Galerie portfolio** : Projets passés avec images Cloudinary
- **SEO** : Descriptions générées automatiquement

### 3.4 Génération Devis (`/api/quotes`)
- **Flux** : Sélection produits → Personnalisation → Validation → PDF
- **PDF** : Génération Puppeteer avec images Cloudinary
- **Email** : Envoi via Nodemailer/Resend

### 3.5 Admin Dashboard (`/admin`)
- **Authentification** : Bypass dev (admin@ns2po.com / admin123)
- **CRUD** : Produits, Bundles, Catégories, Réalisations
- **Assets** : Gestion Cloudinary intégrée

---

## 4. Patterns Architecturaux

### 4.1 TanStack Query Keys

```typescript
const productQueryKeys = {
  all: ['products'],
  lists: () => [...productQueryKeys.all, 'list'],
  list: (filters?: object) => [...productQueryKeys.lists(), filters],
  detail: (id: string) => [...productQueryKeys.all, 'detail', id],
}
```

### 4.2 Mutations Optimistes

```typescript
// Pattern standard pour mutations
const mutation = useMutation({
  mutationFn: async (data) => await $fetch('/api/entity', { method: 'POST', body: data }),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['entity'] })
    const previous = queryClient.getQueryData(['entity'])
    queryClient.setQueryData(['entity'], (old) => [...old, { ...newData, id: 'temp-' + Date.now() }])
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['entity'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['entity'] })
  },
})
```

### 4.3 Validation API (Zod)

```typescript
// server/api/entity/index.post.ts
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = schema.parse(body)
  // ...
})
```

---

## 5. Configuration Environnement

### 5.1 Variables Requises

```bash
# Turso Database
TURSO_DATABASE_URL=libsql://ns2po-election-mvp-*.turso.io
TURSO_AUTH_TOKEN=eyJ...

# Cloudinary
CLOUDINARY_CLOUD_NAME=dsrvzogof
CLOUDINARY_API_KEY=775318993136791
CLOUDINARY_API_SECRET=***

# SMTP (Emails)
SMTP_HOST=mail.topdigitalevel.site
SMTP_PORT=587
SMTP_USERNAME=info@topdigitalevel.site
SMTP_PASSWORD=***
```

### 5.2 Railway Configuration

```bash
# Obligatoire pour Nuxt 3 sur Railway
RAILWAY_BETA_ENABLE_BUILD_V2=1
```

---

## 6. Commandes Développement

| Commande | Description |
|----------|-------------|
| `pnpm install` | Installation dépendances monorepo |
| `pnpm dev` | Serveur dev (PORT=3003) |
| `pnpm build` | Build production |
| `pnpm type-check` | Vérification TypeScript |
| `pnpm lint` | ESLint check |
| `pnpm test:e2e` | Tests Playwright |

---

## 7. Endpoints API Principaux

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/products` | GET | Liste produits |
| `/api/products/search` | GET | Recherche fuzzy |
| `/api/products/[id]` | GET, PUT, DELETE | CRUD produit |
| `/api/campaign-bundles` | GET, POST | Liste/Créer bundles |
| `/api/campaign-bundles/[id]` | GET, PUT, DELETE | CRUD bundle |
| `/api/categories` | GET | Liste catégories |
| `/api/realisations` | GET, POST | Portfolio |
| `/api/quotes/send` | POST | Génération + envoi PDF |
| `/api/health` | GET | Health check Turso |

---

## 8. Contraintes Performance

| Métrique | Target | Mesure |
|----------|--------|--------|
| API Response | < 500ms | Turso Edge latency |
| Recherche Fuzzy | < 50ms | Algorithme local |
| Bundle Initial | < 250KB | Gzip |
| Lighthouse Score | > 90 | Production |

---

## 9. Conventions Code

### 9.1 Nommage
- **Fichiers** : `kebab-case.ts`
- **Classes** : `PascalCase`
- **Variables** : `camelCase`
- **Constantes** : `UPPER_SNAKE_CASE`

### 9.2 Vue Components
- Toujours `<script setup lang="ts">`
- Composition API uniquement
- Props typées avec `defineProps<T>()`

### 9.3 Git
- Conventional Commits : `feat(scope): Message`
- Branches : `feat/`, `fix/`, `refactor/`

---

## 10. État Actuel (Décembre 2025)

### 10.1 Fonctionnalités Complètes
- [x] Catalogue produits avec recherche fuzzy
- [x] Campaign Bundles CRUD complet
- [x] Génération devis PDF
- [x] Portfolio réalisations
- [x] Admin dashboard basique

### 10.2 En Cours
- [ ] Optimisations performance 3G
- [ ] Tests E2E complets
- [ ] Auth admin production

### 10.3 Commits Récents
```
765134a chore(cleanup): dead code elimination
dd5c848 feat(discovery): Descriptions SEO-friendly
10afbcc refactor(realisations): Supprimer dépendance inutile
8afec49 refactor(services): Simplifier Strategy Pattern
```

---

## 11. Problèmes Connus

### 11.1 TypeScript Warnings
- `ProductReferenceValidator.ts:186` - Type null assignability
- `@nuxt/image` - Incompatibilité imports #imports

### 11.2 Composables Non Utilisés (TIER 3)
- `useSSEUpdates.ts` - Prévu pour SSE temps réel
- `useAdminSync.ts` - Prévu pour sync admin
- `useTursoOptimizeMutation.ts` - Prévu pour optimisation DB

---

## 12. Ressources

- **Repository** : https://github.com/workmusicalflow/ns2po-w.git
- **Docs Nuxt** : https://nuxt.com/docs
- **TanStack Query** : https://tanstack.com/query/latest/docs/vue
- **Turso** : https://docs.turso.tech
- **Railway** : https://docs.railway.app

---

## 13. Instructions pour Agents IA

### 13.1 Priorités
1. **Performance 3G** : Toute solution doit fonctionner sur réseau lent
2. **Type-Safety** : TypeScript strict, pas de `any`
3. **Pragmatisme** : Solutions simples, pas d'over-engineering
4. **Validation** : Zod pour toutes les entrées API

### 13.2 Anti-Patterns à Éviter
- ❌ Abstractions prématurées
- ❌ Feature flags pour code temporaire
- ❌ N+1 queries (optimiser en SQL)
- ❌ Bundle > 250KB initial
- ❌ Latence API > 500ms

### 13.3 Workflow Recommandé
1. Lire le code existant avec Serena MCP
2. Valider l'approche avec l'utilisateur
3. Implémenter avec tests
4. Vérifier `pnpm type-check && pnpm lint`
5. Tester localement avant commit

---

*Document généré automatiquement pour faciliter l'onboarding des agents IA sur le projet NS2PO.*
