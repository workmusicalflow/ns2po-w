# Fonctionnalités Clés du MVP

## 1. Catalogue de Produits

- **Source** : Airtable API
- **Types** : Textiles, gadgets, EPI
- **Filtres** : Catégorie, prix, quantité minimale
- **Composant principal** : `ProductCatalog.vue`

## 2. Personnalisation Visuelle

- **Upload de logos** : Cloudinary SDK
- **Prévisualisation temps réel** : Canvas API
- **Formats supportés** : PNG, JPG, SVG
- **Composant principal** : `ProductCustomizer.vue`

## 3. Génération de Devis

- **Calcul dynamique** : Quantité × Prix unitaire + Options
- **Export PDF** : jsPDF ou API
- **Sauvegarde** : Turso DB
- **Composant principal** : `QuoteGenerator.vue`

## 4. Formulaires de Contact

- **Types** : Devis, pré-commande, maquette sur-mesure
- **Validation** : Zod + Vee-Validate
- **Envoi** : API Routes Nuxt

## 5. Campaign Bundles (Packs Électoraux)

### Packs Simplifiés (3 options)
- **Pack Argent** : 5K personnes (local)
- **Pack Or** : 10-15K personnes (régional)
- **Pack Platinium** : 20-30K personnes (national)

### Architecture
- **CMS** : Tables Airtable dédiées
- **API** : Routes dynamiques avec cache
- **Fallback** : Données statiques si API échoue
- **Cache** : Système intelligent avec TTL et invalidation

## 6. Assets Management

### Scripts de Gestion
```bash
# CLI complet de gestion des assets
node scripts/asset-manager.mjs <command> [options]

# Commandes disponibles :
node scripts/asset-manager.mjs add <file-path>        # Upload asset
node scripts/asset-manager.mjs remove <public-id>    # Supprimer asset
node scripts/asset-manager.mjs sync                  # Synchronisation complète
```

### Interface Admin
- `/admin/assets` : Gestion visuelle des assets
- `/admin/assets/upload` : Interface d'upload avec drag & drop
- Convention de nommage : `[type]-[description]-[variant].[ext]`

## 7. Composables Métier

- `useQuoteCalculator()` : Calcul de devis avec remises
- `useContactForm()` : Validation et soumission formulaires
- `useProducts()` : Interface Airtable pour le catalogue
- `useDatabase()` : Services Turso (clients, commandes, paiements)
- `useCampaignBundles()` : Gestion des packs électoraux
- `useCache()` : Système de cache avancé

## 8. Optimisations Performance

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
- **Campaign Bundles** : Cache intelligent avec invalidation