# Instructions pour Claude Code - Projet NS2PO

## Contexte du Projet

**NS2PO** est une PMI ivoirienne spécialisée dans la publicité et promotion par l'objet depuis 2011. Nous développons un écosystème digital moderne avec comme premier MVP une plateforme ciblée pour les élections.

### Objectif Principal

Créer "NS2PO Élections MVP" - une plateforme de génération de devis et pré-commande de gadgets personnalisés pour les acteurs politiques.

## Architecture Technique

### Stack Principal

- **Frontend :** Nuxt.js 3 + Vue.js + TypeScript + Tailwind CSS
- **Backend :** API Routes Nuxt + Turso (SQLite)
- **Données :** Airtable (catalogue produits)
- **Médias :** Cloudinary (images/logos)
- **Déploiement :** Vercel
- **Monorepo :** Turborepo + pnpm workspaces

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

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_USER=contact@ns2po.ci
SMTP_PASS=XXXXXXXXXXXXXXXX

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

## Contact et Support

- **Lead Technique :** [Votre contact]
- **Documentation API :** [Lien vers la doc]
- **Monitoring :** [Dashboard Vercel]
- **Issues :** Utiliser les GitHub Issues du repo

---

**Dernière mise à jour :** [Date]
**Version du guide :** 1.0
