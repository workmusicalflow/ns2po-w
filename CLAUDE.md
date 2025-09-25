# Projet NS2PO Élections MVP

## Contexte

PMI ivoirienne de publicité par l'objet depuis 2011, NS2PO digitalise son offre via une plateforme MVP ciblée pour les élections : génération de devis et précommande de gadgets personnalisés.

## Objectifs

* MVP simple, rapide, sans authentification utilisateur prématurée
* Optimiser images avec Cloudinary pour performance mobile
* Implémenter tests E2E critiques Playwright sur parcours devis
* Éviter dette technique, over-engineering et sous-exploitation des MCP serveurs

## Architecture

**Développement POO, SOLID, CLEAN CODE, simple et pragmatique**
* **Frontend** : Nuxt 3 + Vue 3 + TypeScript + Tailwind + HeadlessUI
* **Backend** : API Routes Nuxt + Turso (SQLite)
* **Migration** : Airtable → Turso (cache performant)
* **Admin CMS** : Mini-CMS sécurisé `/admin` avec Shadcn-vue + authentification middleware
* **Médias** : Cloudinary (upload, optimisation, transformation)
* **Déploiement** : Vercel, monorepo Turborepo + pnpm workspaces
* **Outils clés** : Drizzle ORM pour base typée, Nitro-cache, Playwright, Vitest
* **État Management** : TanStack Query (Vue Query) pour cache et mutations

## Gestion d'État avec TanStack Query

### Vue d'ensemble
Le projet utilise **TanStack Query (Vue Query)** comme solution principale pour la gestion d'état serveur, remplaçant les patterns traditionnels de fetch + store.

### Architecture des Queries
**Composables de requête** : `useProductsQuery`, `useAssetsQuery`, `useBundlesQuery`, `useCategoriesQuery`

```typescript
// Structure type des query keys pour cache hiérarchique
const productQueryKeys = {
  all: ['products'],
  lists: () => [...productQueryKeys.all, 'list'],
  list: (filters?: object) => [...productQueryKeys.lists(), filters],
  details: () => [...productQueryKeys.all, 'detail'],
  detail: (id: string) => [...productQueryKeys.details(), id],
  bundles: (id: string) => [...productQueryKeys.all, 'bundles', id],
}
```

### Architecture des Mutations
**Composables de mutation** : `useCreateProductMutation`, `useUpdateProductMutation`, `useDeleteProductMutation`, `useBulkUpdateProductsMutation`

#### Pattern de mutation optimiste
```typescript
export function useCreateProductMutation() {
  return useMutation({
    onMutate: async (variables) => {
      // 1. Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })

      // 2. Snapshot pour rollback
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // 3. Mise à jour optimiste avec ID temporaire
      const optimisticProduct = { id: `temp-${Date.now()}`, ...variables }
      queryClient.setQueryData(productQueryKeys.list(), (old = []) => [optimisticProduct, ...old])

      return { previousProducts, optimisticProduct }
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidation ciblée + pré-population
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)

      // Remplacer l'optimistic update par les vraies données
      if (context?.optimisticProduct) {
        queryClient.setQueryData(productQueryKeys.list(), (old = []) =>
          old.map(product =>
            product.id === context.optimisticProduct.id ? data : product
          )
        )
      }
    }
  })
}
```

### Gestion du Cache
**Stratégies d'invalidation** : Invalidation ciblée pour éviter les re-fetch inutiles
- `queryClient.invalidateQueries({ queryKey: ['products'] })` - Invalide toutes les queries produits
- `queryClient.setQueryData(key, data)` - Pre-population du cache
- `queryClient.removeQueries({ queryKey: key })` - Suppression après delete

**Stale Time & GC Time** : Configuration adaptée par type de données
```typescript
// Données fréquemment modifiées (produits)
staleTime: 1000 * 60 * 5, // 5 minutes

// Données quasi-statiques (catégories)
staleTime: 1000 * 60 * 30, // 30 minutes
```

### Intégration Base de Données
**Jointures SQL optimisées** pour éviter les N+1 queries côté API :

```sql
-- API /api/products avec relations
SELECT
  p.*,
  c.id as categoryId, c.name as categoryName, c.slug as categorySlug
FROM products p
LEFT JOIN categories c ON p.category = c.id
```

**Mapping côté frontend** :
```typescript
// Transformation API → Frontend
const product = {
  ...apiData,
  categoryDetails: {
    id: apiData.categoryId,
    name: apiData.categoryName,
    slug: apiData.categorySlug
  }
}
```

### Patterns Avancés

#### Background Refetch avec stale-while-revalidate
```typescript
const { data, isStale } = useProductsQuery(filters, {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true
})
```

#### Optimistic Updates avec correction d'erreur
```typescript
onError: (error, variables, context) => {
  // Rollback optimiste
  queryClient.setQueryData(key, context.previousValue)

  // Notification d'erreur
  globalNotifications.crudError.created('produit', error.message)
}
```

#### Bulk Operations avec transaction-like behavior
```typescript
onMutate: async ({ ids, updates }) => {
  const previousStates = {}
  for (const id of ids) {
    previousStates[id] = queryClient.getQueryData(['products', 'detail', id])
    queryClient.setQueryData(['products', 'detail', id], old => ({ ...old, ...updates }))
  }
  return { previousStates, ids }
}
```

### Performance & Optimisations
- **Pagination** avec `keepPreviousData: true` pour UX fluide
- **Infinite Queries** pour listes longues (assets Cloudinary)
- **Selective Invalidation** pour minimiser les re-renders
- **Optimistic Updates** pour perception de rapidité
- **Pre-population** du cache détail depuis les listes

### Debugging
```typescript
// DevTools intégrés
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

// Logs de cache en développement
queryClient.getQueryCache().subscribe(event => {
  console.log('Query cache event:', event)
})
```

## Design System

### Couleurs principales
**Primaire** : `#C99A3B` (Ocre)
**Accent** : `#6A2B3A` (Bourgogne)
**Fond** : `#F8F8F8`
**Texte** : `#2D2D2D`

### Typographie
**Titres** : Poppins (gras, condensé)
**Corps** : Inter (lisible)

Configuration Tailwind avec tokens CSS variables pour couleurs et polices.

## Fonctionnalités MVP

* Catalogue produits depuis Turso Database (abandon Airtable complet)
* Personnalisation visuelle avec upload logos (Cloudinary, Canvas)
* Génération devis dynamique, export PDF, sauvegarde Turso
* Formulaires validés (Zod, Vee-Validate), envoi API Nuxt

## Mini-CMS Administration ✨

### Architecture `/admin`
**Interface** : Dashboard sécurisé avec stats temps réel (produits, bundles, sync)
**Authentification** : Middleware avec bypass développement (`admin@ns2po.com` / `admin123`)
**UI Framework** : Shadcn-vue (alternative gratuite à Nuxt UI Pro)
**Layout** : Navigation sidebar dédiée avec branding NS2PO
**Composants** : DataTable, FormField, Modal réutilisables

### Fonctionnalités CMS
**Monitoring** : Health check Turso, statistiques performance
**Gestion données** : CRUD produits, bundles, catégories via Turso
**Navigation** : Dashboard, Products, Bundles, Categories, Settings
**APIs intégrées** : `/api/products`, `/api/campaign-bundles`, `/api/categories`, `/api/health`

### Sécurité
* Middleware d'authentification sur toutes les routes `/admin/*`
* Mode développement : accès direct sans auth
* Production : localStorage token validation (à migrer vers JWT)

## Intégrations Externes

* **Turso Database** - Base de données principale (Edge SQLite)
* **Cloudinary SDK** - Gestion et optimisation images
* **SMTP** - Envoi emails (devis, notifications)

## Variables d'Environnement

```bash
# Turso - Infrastructure Principale (Edge Database)
TURSO_DATABASE_URL=libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=XXXXXXXXXXXXXXXX

# Cloudinary - Gestion Médias
CLOUDINARY_CLOUD_NAME=dsrvzogof
CLOUDINARY_API_KEY=775318993136791
CLOUDINARY_API_SECRET=ywTgN-mioXQXW1lOWmq2xNAIK7U

# SMTP - Envoi Emails
SMTP_HOST=mail.topdigitalevel.site
SMTP_PORT=587
SMTP_USERNAME=info@topdigitalevel.site
SMTP_PASSWORD=undPzZ3x3U
```

## Qualité & Sécurité

* TypeScript strict, ESLint + Prettier automatiques via Husky
* Conventional Commits, conventions Vue/Nuxt suivies
* Validation zod côté backend, protection CSRF, rate limiting API

## Workflow Git

* **Branches** : `main` (prod), `develop` (intégration), `feat/fix/[ticket]-desc`
* **PR** : tests passants, review dev, merge approuvé, déploiement preview

## Performance & Accessibilité

* Chargement lazy, images WebP/AVIF, responsive
* Taille bundle initiale < 250KB
* WCAG AA : contraste, navigation clavier, alt text
* SEO : meta dynamiques, Open Graph, structured data, sitemap automatique

## Maintenance & Monitoring

* Mise à jour dépendances avec `pnpm update` + tests
* Monitoring : Vercel Analytics, Sentry à configurer
* Logs via composables Vue, debug local Nuxt + réseau

## Commandes clés

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test   # unit + e2e
```

## Serveurs MCP Disponibles

### Core Development
**Serena** : excelle dans la navigation et la manipulation de bases de code complexes, fournissant des outils qui prennent en charge la récupération et l'édition précises de code en présence de bases de code volumineuses et fortement structurées.
**Context7** : Documentation à jour des technologies (Nuxt, Vue.js, etc) pour éviter les hallucinations et améliorer la pertinence du code généré.

### Project Management
**Task Master** : Gestion de projets et tâches structurées avec tracking de progression.
**Pareto Planner** : Planification 80/20 pour priorisation intelligente des tâches.

### Development Tools
**ESLint Master** : Un serveur MCP ESLint intelligent, conçu pour les monorepos et les workflows de développement modernes.
**Gemini Copilot** : Assistant IA Google pour génération de code offrant une expérience de conversation persistante et multi-tours.
**GPT5 Copilot** : Assistant IA OpenAI pour développement offrant une expérience de conversation persistante et multi-tours.
**Perplexity Copilot** : Assistant IA de raisonnement et de recherche connecté à internet. Pour des tâches nécessitant des informations précises et récentes.
**Code Critique** : Analyse de qualité de code pour détecter les **anti-patterns**, les **"code smells"** et la **complexité excessive**. analyse sur la conception et la maintenabilité du code.

## Repository

https://github.com/workmusicalflow/ns2po-w.git

- avant de démarrer le serveur de developpement en arrière plan veuillez toujours vérifier s'il nst pas déjà actif. si besoin vous arrêter le ou les serveur actif et relancez proprement.
- Après des implémentations ou corrections importantes veuillez toujours lancer check de types et la vérification lint, nous devons éviter toute regession ou pollution.
- utilise toujours le serveur mcp "serena" pour tes recherches dans le code base et s'il ne fonctionn epas tu pourra utiliser tes outils natifs pour y arriver.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.