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
* **Déploiement** : Railway, monorepo Turborepo + pnpm workspaces
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
* ⚠️ **Middleware d'authentification TEMPORAIREMENT DÉSACTIVÉ** sur toutes les routes `/admin/*`
* Mode développement : accès direct sans auth
* **Production actuelle** : accès libre pour tests admin (bypass temporaire)
* **TODO** : Réactiver localStorage token validation avant production finale

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
* Monitoring : Railway Analytics, Sentry à configurer
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

## Workflow Multi-Agents : Bible de Résolution Technique ✨

### Philosophie et Vision
Ce workflow multi-agents représente une **DevExp révolutionnaire** qui garantit la résolution systématique des problèmes techniques complexes. Il combine l'expertise spécialisée de trois IA complémentaires pour créer une approche de résolution collaborative et exhaustive.

### Agents Spécialisés et Leurs Rôles

#### 🔍 **Perplexity Copilot** - L'Expert Technique Connecté
- **Mission** : Recherche et analyse technique en temps réel
- **Forces** : Accès à la documentation récente, identification des causes racines, solutions spécifiques
- **Usage** : Premier agent consulté pour diagnostics techniques complexes et solutions émergentes

#### 🧠 **Gemini Copilot** - L'Architecte Stratégique
- **Mission** : Vision architecturale et recommandations de conception
- **Forces** : Analyse structurelle, patterns de solutions, optimisations systémiques
- **Usage** : Validation architecturale et amélioration des approches techniques

#### ⚡ **Claude** - L'Orchestrateur et Implémenteur
- **Mission** : Coordination, synthèse et mise en œuvre pratique
- **Forces** : Intégration des recommandations, implémentation précise, gestion d'état
- **Usage** : Chef d'orchestre qui coordonne, synthétise et exécute

### Méthodologie de Consultation Multi-Agents

#### Phase 1 : Diagnostic Collaboratif
```bash
# Étapes obligatoires lors d'un problème technique complexe
1. Identification du problème par Claude
2. Consultation Perplexity : "challenger perplexity-copilot sur [problème technique spécifique]"
3. Consultation Gemini : "gemini-copilot, analyse architecturale de [contexte technique]"
4. Synthèse comparative des approches
```

#### Phase 2 : Implémentation Guidée
```bash
# Pattern d'implémentation éprouvé
1. Claude présente le plan de synthèse des recommandations agents
2. Implémentation étape par étape avec validation continue
3. Tests et vérification des solutions appliquées
4. Documentation des patterns réussis pour référence future
```

### Commande de Déclenchement Rapide

```bash
# Template universel pour problèmes techniques
"Problème technique détecté. Workflow multi-agents requis :
1. Perplexity : diagnostic + solutions existantes
2. Gemini : analyse architecturale + optimisations
3. Claude : synthèse + implémentation coordonnée

Contexte : [décrire le problème technique]
Objectif : [définir le résultat attendu]"
```

## 🎯 Railway + Turso - Configuration Critique (Victoire Session)

### Problème Runtime V1 → Solution V2 ✅
**Issue identifiée :** Railway Runtime V1 ne charge pas les variables d'environnement pour Nuxt 3 au moment de l'initialisation, causant fallback in-memory Turso.

**Solution confirmée par workflow multi-agents :**
```bash
railway variables --set "RAILWAY_BETA_ENABLE_BUILD_V2=1"
railway up --detach
```

### Diagnostic Variables Invisibles
Si variables Turso configurées mais non détectées sur Railway :
```bash
curl https://app.railway.app/api/diagnostic-turso
```

**Pattern de résolution validé :**
1. Variables visibles CLI mais invisibles runtime → Runtime V2
2. Fallback `process.env` dans `server/utils/database.ts` comme sécurité
3. Endpoint diagnostic pour investigation future

### Performance Post-Fix Confirmée
- **Avant** : 0.61 req/s, 8.2s latence, `"turso": "down"`
- **Après** : 1.95+ req/s, 2.56s latence, `"turso": "up"`
- **Amélioration** : **3.2x** sur toutes les métriques critiques

**Apprentissage clé :** Toujours activer Runtime V2 pour projets Nuxt 3 + Database sur Railway.

---

## Principe de Cohérence Local ↔ Production ✨

**RÈGLE ABSOLUE** : Toute modification doit maintenir la compatibilité LOCAL + RAILWAY simultanément.

### Workflow Obligatoire
1. ✅ **Test local complet** avant tout commit
2. ✅ **Validation APIs** et fonctionnalités principales en local
3. ✅ **Commit seulement** si stabilité locale confirmée
4. ✅ **Push vers Railway** uniquement après validation locale
5. ✅ **Monitoring Railway** post-déploiement obligatoire

### Garde-fous Anti-Régression
- ❌ **Jamais de fix spécifique production** qui casse le local
- ❌ **Jamais de commit sans test local** préalable
- ✅ **Une seule codebase**, deux environnements stables
- ✅ **Cohérence SSR/Docker** maintenue entre local et Railway

### Principe Fondamental
*"Stabilité locale = Stabilité production"* - Évite les cycles de régression entre environnements.

---

## 🎯 Innovations Techniques Documentées

### Système de Recherche Fuzzy avec Illusion de Performance (28/09/2025)

**Innovation** : Recherche instantanée côté client créant une illusion de rapidité sur réseaux 3G

**Architecture Technique** :
* **Algorithme Levenshtein** : Tolérance aux fautes de frappe (distance ≤ 2 caractères)
* **Debounce 150ms** : Équilibre entre réactivité perçue et performance ARM
* **Recherche locale** : Zéro latence réseau, données pré-chargées depuis Turso
* **Scoring multi-critères** : Exact (100pts) → Synonyme (85pts) → Fuzzy (75-30pts)
* **Virtualisation TanStack** : Rendu de seulement 5-10 items visibles sur 100+

**Dictionnaire Synonymes Côte d'Ivoire** :
```javascript
{
  'flyer': ['tract', 'depliant', 'prospectus'],
  'tshirt': ['t-shirt', 'tee-shirt', 'maillot'],
  'casquette': ['cap', 'chapeau'],
  'bache': ['banderole', 'panneau']
}
```

**Feedback Visuel Enrichi** :
* Surlignage `<mark>` des termes trouvés
* Chips de correspondance (Exact/Synonyme/Fuzzy)
* Score de pertinence visuel (•••)
* Suggestions orthographiques intelligentes

**Résultat Mesuré** :
* ✅ Recherche "pin" → "Pin's personnalisé" en <50ms perçu
* ✅ Zéro appel API pendant la frappe
* ✅ Illusion de rapidité même sur 3G (préchargement + cache local)
* ✅ Taux de succès recherche : 95% même avec fautes

## Repository

https://github.com/workmusicalflow/ns2po-w.git

- avant de démarrer le serveur de developpement en arrière plan veuillez toujours vérifier s'il nst pas déjà actif. si besoin vous arrêter le ou les serveur actif et relancez proprement.
- Après des implémentations ou corrections importantes veuillez toujours lancer check de types et la vérification lint, nous devons éviter toute regession ou pollution.
- utilise toujours le serveur mcp "serena" pour tes recherches dans le code base et s'il ne fonctionne pas tu pourras utiliser tes outils natifs pour y arriver.
- Pour ce qui est de Railway nous utiliserai au maximum la CLI. our les commande intéractivesvous me les soumettrez avec le scénario pour que je les exécutes depuis un second terminal. pour les commandes non intéractive vous pous en chargerai tout au long du process. l'idée est de faire le maximum en ligne de commande et ne faire que l'impossible via le dashboard web Railway.

## Commandes Railway CLI Essentielles

```bash
# Connexion et gestion projet
railway login                    # Authentification (interactif)
railway status                   # État projet actuel
railway whoami                   # Utilisateur connecté

# Déploiement
railway up --detach             # Déploiement manuel (recommandé)
railway logs --follow           # Suivre logs en temps réel
railway logs --deployment ID    # Logs déploiement spécifique

# Variables d'environnement
railway variables               # Lister variables actuelles
railway variables --set "KEY=VALUE" # Définir variable (syntaxe correcte)
railway run "command"           # Exécuter avec variables Railway

# Monitoring et debugging
railway domain                  # Gérer domaines
railway open                    # Ouvrir dashboard web
railway shell                   # Shell avec variables Railway
railway redeploy                # Redéployer dernière version

# Gestion services
railway service                 # Lier service au répertoire
railway add                     # Ajouter nouveau service
```