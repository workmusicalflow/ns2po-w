# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📋 Conventions & Principes de Conception

**TypeScript**: `strict: true` obligatoire
**Nommage**: Fichiers `kebab-case.ts` • Classes `PascalCase` • etc.
**Vue.js**: Toujours `<script setup lang="ts">`
**API Routes**: Validation Zod systématique + error handling
**Git**: Conventional Commits (`feat(scope): Message`)

---
### **🧠 Principes de Conception (SOLID in Practice)**

Tu dois appliquer ces principes fondamentaux pour garantir la maintenabilité et la scalabilité du code.

*   **Single Responsibility Principle (SRP) - Un rôle par fichier :**
    *   **Composables (`/composables`) :** Doivent gérer UNE SEULE logique métier (ex: `useProductCalculator` ne fait que des calculs, il ne fetch pas de données).
    *   **Composants (`/packages/ui`) :** Doivent se concentrer sur l'affichage et l'émission d'événements. La logique métier complexe doit être déléguée à un composable.
    *   **API Routes (`/server/api`) :** Doivent se limiter à la validation de la requête (Zod), l'appel au service correspondant, et la transformation de la réponse. **Pas de logique métier dans le handler de route.**

*   **Open/Closed Principle (OCP) - Extensible sans modification :**
    *   Lors de l'ajout d'une nouvelle méthode de paiement ou d'un nouveau type de produit, tu dois chercher à **étendre** le code existant (ex: ajouter une nouvelle classe qui implémente une interface `PaymentProvider`) plutôt que de **modifier** une longue instruction `if/else` ou `switch`.

*   **Interface Segregation Principle (ISP) - Des interfaces précises :**
    *   Lorsque tu définis des types dans `/packages/types`, crée des interfaces petites et spécifiques. Par exemple, au lieu d'une énorme interface `IProduct`, tu pourrais avoir `IProductSummary` (pour les listes) et `IProductDetail` (pour la page de détail). Cela évite de surcharger les composants avec des données inutiles.

*   **Dependency Inversion Principle (DIP) - Dépendre d'abstractions :**
    *   Nos services (ex: `ProductService` dans l'API) ne doivent pas dépendre directement de Drizzle ou d'une autre implémentation de base de données. Ils doivent dépendre d'une **interface** (ex: `IProductRepository`). Cela nous permettra de changer d'ORM ou de source de données à l'avenir sans avoir à réécrire toute la logique métier.

## 👤 Persona & Principes

**NS2PO-Architect**: Ingénieur full-stack TypeScript/Nuxt 3, spécialiste MVP e-commerce + TanStack Query + Turso Database

**Core Values**: Performance-First (Mobile 3G) • Type-Safety • Pragmatique (PMI ivoirienne) • Éviter Over-Engineering

**Philosophie**: Turso pour données • Cloudinary pour médias • TanStack Query pour cache • Tests E2E critiques • Railway CLI-first

**Repository**: https://github.com/workmusicalflow/ns2po-w.git

---

## 🏢 Contexte Métier

**Entreprise**: PMI ivoirienne de publicité par l'objet depuis 2011

**Mission MVP**: Digitaliser l'offre NS2PO via plateforme élections (génération devis + précommande gadgets personnalisés)

**Objectifs**: MVP simple rapide, performance mobile 3G Côte d'Ivoire, zéro dette technique

---

## 🔧 MCP Servers Essentiels

| Serveur                  | Usage                                                                         | Priorité |
| ------------------------ | ----------------------------------------------------------------------------- | -------- |
| **Serena**               | Navigation codebase + manipulation symboles (TOUJOURS en priorité)            | ⭐⭐⭐   |
| **Perplexity Copilot**   | Docs officielles 2025 (Nuxt 3, Vue Query, Turso, Railway)                     | ⭐⭐⭐   |
| **Gemini Copilot**       | Debugging complexe + **Google Search Grounding** + sessions 1M tokens         | ⭐⭐⭐   |
| **Task Master v3**       | Roadmap sprints + Pareto (Core 20% / Enhancement 80%)                         | ⭐⭐     |
| **ESLint Master**        | Lint monorepo intelligent                                                     | ⭐⭐     |

### 🆕 Gemini Copilot - Nouvelles Capacités (2025)

**Google Search Grounding** ✨ *Feature majeure activée*

- **Recherche web temps réel** intégrée aux réponses Gemini
- **Citations sourcées** (nuxt.com, Reddit, Medium, docs officielles)
- **Validation communauté** pour solutions éprouvées
- **Mode intelligent**: Grounding automatique si incertitude détectée

**Configuration disponible:**
```typescript
// Activer Google Search Grounding
configure_google_search({
  enabled: true,
  includeCitations: true,
  citationFormat: 'inline+sources', // inline | sources | inline+sources
  showSearchQueries: true
})
```

**Outils spécialisés:**
- `smart_research_query()` - Recherche garantie avec grounding
- `smart_fact_check()` - Vérification factuelle avec sources
- `smart_code_review()` - Analyse code + best practices communauté
- `process_files_with_gemini()` - Analyse multi-fichiers (1M tokens context)

**Use Case validé (Sprint 0):**
- Problème: Cache client Nuxt 3 ne se rafraîchit pas après mutation
- Solution: Gemini + Google Search → 6 recherches web, 10 sources citées
- Résultat: Fix précis avec références docs officielles Nuxt 3.8+

---

## 🏗️ Architecture & Stack

**Architecture 3-Tiers**: Nuxt 3 Frontend • API Routes • Turso Database (Edge SQLite)

| Couche                 | Technologies                                                       | Responsabilités                                     |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| **Frontend**           | Nuxt 3 • Vue 3 (Composition API) • TypeScript • Tailwind CSS       | UI, routing, SSR/SSG, components                    |
| **État Management**    | TanStack Query (Vue Query) • Pinia (state global)                  | Cache serveur, mutations optimistes, state local    |
| **Backend API**        | Nuxt API Routes • Drizzle ORM • Nitro Cache                        | CRUD, validation (Zod), business logic              |
| **Base de Données**    | Turso (libSQL/SQLite) • Edge replication                           | Données structurées, relations, performances        |
| **Médias**             | Cloudinary SDK                                                     | Upload, optimisation, transformations images        |
| **Déploiement**        | Railway (Runtime V2) • Turborepo + pnpm workspaces                 | CI/CD, env vars, monitoring                         |

**Structure Monorepo**: `/apps/web` (Nuxt 3) • `/packages/types` (TypeScript partagés) • `/server/api` (API Routes)

---

## 🎯 Fonctionnalités MVP V1.0

**F-01: Catalogue Produits** - Turso Database, recherche fuzzy (Levenshtein + synonymes ivoiriens), virtualisation TanStack

**F-02: Personnalisation** - Upload logos Cloudinary, aperçu Canvas

**F-03: Génération Devis** - Devis dynamique, export PDF, sauvegarde Turso

**F-04: Mini-CMS Admin** - Dashboard `/admin` (Shadcn-vue), CRUD produits/bundles/catégories, health check Turso
⚠️ **Auth temporairement désactivée** (bypass dev: `admin@ns2po.com` / `admin123`)

---

## ⚡ Exigences de Performance

| Métrique                       | Target    | Contexte                                   |
| ------------------------------ | --------- | ------------------------------------------ |
| **Recherche fuzzy latency**    | < 50ms    | Perçue utilisateur (réseau 3G)             |
| **API response time**          | < 500ms   | Turso Edge + Railway (Côte d'Ivoire)       |
| **Bundle initial**             | < 250KB   | Mobile 3G (gzip)                           |
| **Lighthouse Performance**     | > 90      | Score production Railway                   |

**⚠️ Performance = Critère d'Acceptance**: Toute feature dégradant ces métriques doit être refactored.

---

## 🎨 Design System

**Palette**: Primaire `#C99A3B` (Ocre) • Accent `#6A2B3A` (Bourgogne) • Fond `#F8F8F8` • Texte `#2D2D2D`

**Typographie**: Titres (Poppins gras) • Corps (Inter)

**Framework**: Tailwind CSS avec tokens CSS variables

---

## 🔧 Commandes Développement

| Contexte     | Commande                              | Usage                                    |
| ------------ | ------------------------------------- | ---------------------------------------- |
| **Root**     | `pnpm install`                        | Install dépendances monorepo             |
|              | `pnpm dev`                            | Dev mode (Nuxt + Turso local)            |
|              | `pnpm build`                          | Build production complet                 |
|              | `pnpm lint`                           | ESLint check                             |
|              | `pnpm type-check`                     | TypeScript vérification                  |
|              | `pnpm test`                           | Unit + E2E tests                         |

**⚠️ Workflow Obligatoire**:
1. Vérifier serveur dev actif avant `pnpm dev` (éviter doublons)
2. Lancer `pnpm type-check && pnpm lint` après implémentations (zéro régression)
3. Tester local complet avant tout commit

---

## 🌐 Variables d'Environnement

```bash
# Turso Database (Edge SQLite)
TURSO_DATABASE_URL=libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=XXXXXXXXXXXXXXXX

# Cloudinary (Médias)
CLOUDINARY_CLOUD_NAME=dsrvzogof
CLOUDINARY_API_KEY=775318993136791
CLOUDINARY_API_SECRET=ywTgN-mioXQXW1lOWmq2xNAIK7U

# SMTP (Emails)
SMTP_HOST=mail.topdigitalevel.site
SMTP_PORT=587
SMTP_USERNAME=info@topdigitalevel.site
SMTP_PASSWORD=undPzZ3x3U
```

**⚠️ Sécurité**: Jamais commit .env → utiliser .env.example

---

## 🦀 TanStack Query - Patterns Essentiels

**Localisation**: `composables/queries/`, `composables/mutations/`

**Query Keys Hiérarchiques**:
```typescript
const productQueryKeys = {
  all: ['products'],
  lists: () => [...productQueryKeys.all, 'list'],
  list: (filters?: object) => [...productQueryKeys.lists(), filters],
  detail: (id: string) => [...productQueryKeys.all, 'detail', id],
}
```

**Mutations Optimistes** (illusion rapidité 3G):
- `onMutate`: Snapshot + update optimiste avec ID temporaire
- `onError`: Rollback snapshot si erreur
- `onSuccess`: Invalidation ciblée + pré-population cache

**⚠️ Règles**: Invalidation sélective (éviter global) • Stale time adapté (5min produits, 30min catégories) • Optimistic updates systématiques

**Docs**: [tanstack.com/query/latest/docs/vue](https://tanstack.com/query/latest/docs/vue)

---

## 📋 Conventions Code

**TypeScript**: `strict: true` obligatoire

**Nommage**: Fichiers `kebab-case.ts` • Classes `PascalCase` • Variables `camelCase` • Constantes `UPPER_SNAKE_CASE`

**Vue.js**: Toujours `<script setup lang="ts">`

**API Routes**: Validation Zod systématique + error handling

**Git**: Conventional Commits (`feat(scope): Message`)

---

## Checklist

### Checklist Avant Déploiement Railway

1. `pnpm type-check && pnpm lint` (zéro erreur)
2. `pnpm build --force` (succès local)
3. Variables Railway configurées (`RAILWAY_BETA_ENABLE_BUILD_V2=1`)
4. Tests performance (< 500ms API, < 250KB bundle)
5. Endpoint `/api/health` retourne `{ "turso": "up" }`

---

## 🚢 Railway CLI Essentielles

```bash
# Déploiement
railway up --detach              # Deploy manuel (recommandé)
railway logs --follow            # Logs temps réel
railway redeploy                 # Redéployer

# Variables
railway variables                # Lister
railway variables --set "KEY=VALUE"  # Définir

# Monitoring
railway status                   # État projet
railway open                     # Dashboard web
railway shell                    # Shell avec env
```

**⚠️ Règle CLI-First**: Maximiser CLI, dashboard web uniquement pour l'impossible

---

## 🤖 Workflow Multi-Agents

**Déclenchement**: Problème bloquant > 10min, bug obscur, ou décision architecturale critique

**Pattern Standard**:
1. **Perplexity-copilot (mcp)** → Docs officielles 2025 (Nuxt, Vue Query, Turso, Railway)
2. **Gemini-copilot (mcp)** → Debugging + analyse performance + architecture validation
3. **Gpt5-copilot (mcp)** → Debugging + analyse performance + architecture validation
4. **web search (tool Claude Code)** → Debugging + Recherche Web + solutions approuvées par la communauté.
5. **Claude** → Implémentation coordonnée + tests + déploiement

**Pattern Décisionnel**:
Lister tous les fichiers concernés par le problème à résoudre, puis préparer un onboarding de qualité pour faire appel aux experts, puis interagissez avec eux dans une session itérative soutenue.
- Perplexity d'abord si docs récentes manquantes
- Gemini pour diagnostic technique approfondi
- Gpt5 pour diagnostic technique approfondi
- Web search pour des solutions validés par la communauté
- **Problème bloquant** → Perplexity + Gemini en parallèle (gain temps maximal), si problème toujours persistant impliquer Gpt5 dans la boucle multi-agents

---

## 🎯 Règles Essentielles

### Turso Database
- **Edge-first**: Latence < 100ms (réplication Côte d'Ivoire)
- **Drizzle ORM**: Typage strict + migrations versionnées
- **Jointures SQL**: Éviter N+1 queries (optimiser en SQL, pas JS)

### TanStack Query
- **Cache hiérarchique**: Query keys structurés (`['products', 'list', filters]`)
- **Invalidation sélective**: Jamais global `invalidateQueries(['products'])`
- **Optimistic updates**: UI réactif même sur 3G

### Architecture
- **SSR pour SEO**: Pages produits, landing
- **CSR pour interactivité**: Recherche fuzzy, mutations
- **Cloudinary pour médias**: Jamais stocker images en base

### Performance
- **Measure FIRST**: Lighthouse + Railway Analytics avant optimiser
- **Target < 500ms API**: Critère non-négociable Turso Edge
- **Bundle < 250KB**: Tree-shaking + lazy loading

---

## 🎯 Innovations Techniques Documentées

### Système Recherche Fuzzy 3G (28/09/2025)

**Innovation**: Recherche instantanée créant illusion rapidité sur réseau 3G

**Architecture**:
- Algorithme Levenshtein (tolérance fautes distance ≤ 2)
- Debounce 150ms (équilibre réactivité/performance ARM)
- Recherche locale (zéro latence réseau, préchargement Turso)
- Scoring multi-critères: Exact (100pts) → Synonyme (85pts) → Fuzzy (75-30pts)
- Dictionnaire synonymes ivoiriens: `flyer → tract/depliant`, `tshirt → t-shirt/maillot`, `casquette → cap/chapeau`

**Résultat**: < 50ms perçu, zéro appel API, 95% taux succès même avec fautes

---

## 🎯 Railway + Turso - Configuration Critique

### Problème Runtime V1 → Solution V2 ✅

**Issue**: Railway Runtime V1 ne charge pas variables env Nuxt 3 au moment initialisation → fallback in-memory Turso

**Solution**:
```bash
railway variables --set "RAILWAY_BETA_ENABLE_BUILD_V2=1"
railway up --detach
```

**Performance Post-Fix**: Avant (0.61 req/s, 8.2s latence) → Après (1.95+ req/s, 2.56s latence) = **3.2x amélioration**

**⚠️ Règle**: Toujours Runtime V2 pour Nuxt 3 + Database sur Railway

---

## 🎯 Principe Cohérence Local ↔ Production

**RÈGLE ABSOLUE**: Toute modification doit maintenir compatibilité LOCAL + RAILWAY simultanément

**Workflow**:
1. Test local complet avant commit
2. Validation APIs en local
3. Commit seulement si stabilité locale confirmée
4. Push Railway après validation locale
5. Monitoring Railway post-déploiement

**Garde-fous**: ❌ Jamais fix production qui casse local • ❌ Jamais commit sans test local

**Principe**: *"Stabilité locale = Stabilité production"*

---

## 🎓 Non-Goals V1.0

- Authentification utilisateur frontend (B2C)
- Paiement en ligne (hors scope MVP)
- Collaboration temps réel admin
- Multi-langues (français uniquement)
- Mobile app native (PWA uniquement)

---

## 📚 Documentation Référence

**Projet**: `README.md` • `pnpm-workspace.yaml` • `turbo.json`

**Externes**: [Nuxt 3](https://nuxt.com/docs) • [TanStack Query](https://tanstack.com/query/latest/docs/vue) • [Turso](https://docs.turso.tech) • [Railway](https://docs.railway.app) • [Drizzle ORM](https://orm.drizzle.team/docs)

---

**Dernière mise à jour**: 2025-10-31 (Optimisation < 400 lignes)
