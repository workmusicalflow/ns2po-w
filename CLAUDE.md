## Contexte du Projet

**NS2PO** est une PMI ivoirienne spécialisée dans la publicité et promotion par l'objet depuis 2011. Nous développons un écosystème digital moderne avec comme premier MVP une plateforme ciblée pour les élections.

### Objectif Principal

Créer "NS2PO Élections MVP" - une plateforme de génération de devis et pré-commande de gadgets personnalisés pour les acteurs politiques.

**🚫 Anti-patterns à éviter** :

- Sous-utilisation des outils MCP serveurs disponibles
- Accumulation de dette technique
- over-engineering
- Négliger l'Optimisation des Images : Laisser les utilisateurs uploader des logos de 5 Mo et utiliser des images de produits non optimisées.
  Conséquence : Le site sera lent, surtout sur mobile, et l'expérience de personnalisation sera frustrante. La confiance s'érodera instantanément.
  Solution : Intégrer Cloudinary pour gérer l'optimisation, le redimensionnement et la superposition à la volée.
- **L'Authentification Prématurée** : Vouloir mettre en place un système de création de compte / connexion pour le MVP.
  - **Conséquence** : Ajoute une friction énorme pour un utilisateur qui veut juste un devis rapidement. C'est une complexité technique inutile à ce stade.
  - **Solution** : Une pré-commande se fait avec un simple formulaire (nom, email, téléphone). La relation client se gère ensuite hors-ligne.
- **Ignorer les Tests de Bout en Bout (E2E)** : Se contenter de tester les composants de manière isolée.
  - **Conséquence** : Risque qu'un changement casse le parcours utilisateur complet (ex: le formulaire de devis ne s'envoie plus après une mise à jour).
  - **Solution** : Mettre en place un ou deux tests E2E critiques avec **Playwright** qui simulent le parcours complet, de la sélection du produit à la soumission du devis. Ces tests doivent tourner avant chaque déploiement.

## Architecture Technique

### Stack Principal

- **Frontend :** Nuxt.js 3 + Vue.js + TypeScript + Tailwind CSS
- **Backend :** API Routes Nuxt + Turso (SQLite)
- **Données :** Airtable (catalogue produits)
- **Médias :** Cloudinary (images/logos)
- **Déploiement :** Vercel
- **Monorepo :** Turborepo + pnpm workspaces
- - `Turborepo Remote Caching` : Pour accélérer drastiquement les temps de build dans la CI/CD en ne reconstruisant que ce qui a changé.

* `Vercel Edge Functions vs Serverless Functions` : Comprendre les nuances de l'environnement de déploiement pour optimiser la performance et les coûts.
* `Drizzle ORM Nuxt Turso` : Le trio gagnant pour interagir avec la base de données de manière typée et sécurisée.
* `Headless CMS pros and cons` : Pour bien comprendre la philosophie derrière l'utilisation d'Airtable.
* - `Nuxt 3 Data Fetching (useFetch, useAsyncData)` : Les hooks fondamentaux pour récupérer les données (ex: depuis Airtable).

### Structure des Dossiers

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

## Commandes de Développement

### Démarrage

```bash
pnpm install          # Installation des dépendances
pnpm dev              # Lancement du développement
pnpm build            # Build de production
pnpm lint             # Vérification du code
pnpm test             # Tests unitaires
```

### Tests

- **Unitaires :** Vitest pour la logique métier
- **E2E :** Playwright pour les parcours critiques
- **Commande :** `pnpm test` (toujours exécuter avant les commits)

## Standards de Qualité

### Code Style

- **TypeScript strict** activé partout
- **ESLint + Prettier** automatiques via Husky
- **Conventional Commits** obligatoires
- **Vue/Nuxt conventions** respectées

### Patterns à Suivre

1. **Composants :** Pascal Case (`ButtonPrimary.vue`)
2. **Composables :** Camel Case préfixé `use` (`useProductCalculator`)
3. **Types :** Interface préfixée `I` (`IProduct`, `IQuoteRequest`)
4. **Fichiers :** Kebab case (`product-catalog.vue`)

## Fonctionnalités Clés du MVP

### 1. Catalogue de Produits

- **Source :** Airtable API
- **Types :** Textiles, gadgets, EPI
- **Filtres :** Catégorie, prix, quantité minimale
- **Composant principal :** `ProductCatalog.vue`

### 2. Personnalisation Visuelle

- **Upload de logos :** Cloudinary SDK
- **Prévisualisation temps réel :** Canvas API
- **Formats supportés :** PNG, JPG, SVG
- **Composant principal :** `ProductCustomizer.vue`

### 3. Génération de Devis

- **Calcul dynamique :** Quantité × Prix unitaire + Options
- **Export PDF :** jsPDF ou API
- **Sauvegarde :** Turso DB
- **Composant principal :** `QuoteGenerator.vue`

### 4. Formulaires de Contact

- **Types :** Devis, pré-commande, maquette sur-mesure
- **Validation :** Zod + Vee-Validate
- **Envoi :** API Routes Nuxt

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

## Workflow de Développement

### Branches

- `main` : Production (auto-déployée)
- `develop` : Intégration
- `feat/[ticket]-[description]` : Nouvelles fonctionnalités
- `fix/[ticket]-[description]` : Corrections de bugs

### Pull Requests

1. Tests passants obligatoires
2. Review d'au moins 1 développeur
3. Déploiement automatique de preview
4. Merge uniquement si approuvée

## Variables d'Environnement

```bash
# Airtable
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
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

## Débogage et Monitoring

### Logs de Développement

```typescript
// Utiliser le composable de logging
const { logError, logInfo } = useLogger();

try {
  // Code métier
  logInfo("Quote generated successfully", { quoteId });
} catch (error) {
  logError("Quote generation failed", { error, context });
}
```

### Outils de Debug

- **Vue DevTools** : Composants et état
- **Nuxt DevTools** : Performance et routes
- **Console Network** : Appels API
- **Vercel Analytics** : Performance production

## Optimisations Performance

### Images

- **Lazy loading** automatique avec `<NuxtImg>`
- **WebP/AVIF** via Cloudinary
- **Responsive images** avec breakpoints

### Code Splitting

- **Pages** : Automatique avec Nuxt
- **Composants lourds** : `defineAsyncComponent()`
- **Librairies** : Dynamic imports

### Cache

- **API responses** : `nitro-cache` 15 minutes
- **Images** : CDN Cloudinary
- **Static assets** : Headers cache Vercel

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

### Repository GITHUB

https://github.com/workmusicalflow/ns2po-w.git

### Monitoring Production

- **Vercel Analytics** : Performance globale
- **Sentry** : Tracking des erreurs (à configurer)
- **Lighthouse** : Audit qualité

## Points d'Attention Spécifiques

### Performance Mobile

- **Taille bundle** < 250KB initial
- **First Contentful Paint** < 2s
- **Images optimisées** pour écrans haute densité

### Accessibilité

- **Contraste** minimum WCAG AA
- **Navigation clavier** complète
- **Screen readers** compatibles
- **Alt text** sur toutes les images

### SEO

- **Meta tags** dynamiques par page
- **Open Graph** pour partage social
- **Structured data** pour produits
- **Sitemap** automatique

### 🧠 Mindset Gagnant

1. **"Mobile-first, desktop-enhanced"** : Toujours partir du mobile
2. **"Performance budgets"** : Contraintes = créativité
3. **"Progressive enhancement"** : Amélioration continue > big bang
4. **"User preferences first"** : Respecter reduce-motion, save-data
5. **L'attitude** : Curiosité technique + exigence qualité + pragmatisme

- Utiliser terminal-observer (MCP) pour toute commande dont l'exécution est suceptible de prendre du temps. Et en général met à profit tous les serveurs MCP disponibles et utiles à ta progression et ton expérience DevExp.
- pour tout besoin d'avis experts vous aurai à étendre votre collaboration via des sessions conversationnelles itératives avec mcp**gemini-copilot et mcp**gpt5-copilot. pour évaluer les recommandations puis vous prendrez les meilleurs décisions. pour la documentation au niveau des bibliothèques, builder et framework vous pouvez faire de la recherche web ou utiliser le serveur `mcp context7`.
- **vérificateur de types pour le projet TypeScript** :
  ```bash
  cd /Users/ns2poportable/Desktop/ns2po-w/apps/election-mvp && pnpm exec tsc --noEmit
  ```

- vous avez un mcp à votre disposition pour intéragir avec github pour les github actions : `mcp__github-actions-mcp`

### 🔧 Scripts de Maintenance et Interfaces Admin

**Gestion des Assets** :
```bash
# CLI complet de gestion des assets (Cloudinary, Airtable, Turso)
node scripts/asset-manager.mjs <command> [options]

# Commandes disponibles :
node scripts/asset-manager.mjs add <file-path>        # Upload asset
node scripts/asset-manager.mjs remove <public-id>    # Supprimer asset  
node scripts/asset-manager.mjs sync                  # Synchronisation complète
```

**Synchronisation Performance** :
```bash
# Scripts optimisés pour la sync Airtable ↔ Turso
node scripts/sync-performance.mjs <command>

# Commandes disponibles :
node scripts/sync-performance.mjs diff     # Sync différentielle (rapide)
node scripts/sync-performance.mjs full     # Sync complète
node scripts/sync-performance.mjs health   # État de santé de la sync
```

**Interface Admin** :
- `/admin/assets` : Gestion visuelle des assets avec preview et métriques
- `/admin/assets/upload` : Interface d'upload avec drag & drop et validation
- Convention de nommage : `[type]-[description]-[variant].[ext]`
- Validation automatique : formats, taille, optimisation Cloudinary

**Composables Métier** :
- `useQuoteCalculator()` : Calcul de devis avec remises volume/client
- `useContactForm()` : Validation et soumission formulaires
- `useProducts()` : Interface Airtable pour le catalogue
- `useDatabase()` : Services Turso (clients, commandes, paiements)

**Architecture de Données** :
- **Airtable** : Source de vérité (produits, catégories, règles prix)
- **Turso** : Cache performant + données métier (clients, commandes)  
- **Cloudinary** : Assets optimisés avec transformations automatiques