# Guide de Déploiement Netlify - NS2PO Election MVP

> Guide complet pour déployer un monorepo Nuxt 3 avec pnpm sur Netlify (2025)

## 📋 Vue d'ensemble

Ce guide présente les meilleures pratiques 2025 pour déployer une application **Nuxt 3** dans un **monorepo pnpm** sur **Netlify**, avec optimisations de performance et troubleshooting.

---

## 🏗️ Structure du Projet

```
ns2po-w/
├── apps/
│   └── election-mvp/           # Application Nuxt 3.19.2
├── packages/
│   ├── ui/                     # Composants UI partagés
│   ├── types/                  # Types TypeScript
│   ├── composables/            # Composables Vue
│   └── config/                 # Configuration partagée
├── pnpm-workspace.yaml
├── netlify.toml                # Configuration Netlify
├── turbo.json                  # Configuration Turborepo
└── docs/
    └── NETLIFY_DEPLOYMENT_GUIDE.md
```

---

## ⚙️ Configuration Netlify (`netlify.toml`)

```toml
[build]
  # Répertoire contenant l'application Nuxt
  base = "apps/election-mvp"

  # Commande de build pour Nuxt avec pnpm
  command = "cd ../../ && pnpm install && pnpm build --filter=@ns2po/election-mvp"

  # Répertoire de sortie après build
  publish = "apps/election-mvp/.output/public"

[build.environment]
  # Version Node.js recommandée pour Nuxt 3
  NODE_VERSION = "18"
  # Utiliser pnpm comme gestionnaire de packages
  NPM_FLAGS = "--version"
  PNPM_VERSION = "8"
  # Flag obligatoire pour pnpm workspaces sur Netlify
  PNPM_FLAGS = "--shamefully-hoist"

# Configuration des fonctions serverless pour les API routes Nuxt
[functions]
  # Répertoire des fonctions générées par Nuxt
  directory = "apps/election-mvp/.output/server"

# Redirections et règles de routage pour SPA Nuxt
[[redirects]]
  # Redirection pour les routes Nuxt (SPA fallback)
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["public"]}

# Headers pour optimisation performance
[[headers]]
  for = "/_nuxt/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache"

# Configuration spécifique monorepo
[build.processing]
  # Optimisations pour les images Cloudinary
  skip_processing = true

# Variables d'environnement pour le build
[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "production"

[context.branch-deploy.environment]
  NODE_ENV = "development"
```

---

## 🔧 Configuration Nuxt 3 (`nuxt.config.ts`)

```typescript
export default defineNuxtConfig({
  // Configuration Nitro pour Netlify
  nitro: {
    preset: 'node-server',              // Pour SSR Netlify
    routeRules: {
      // Cache statique
      '/': { prerender: false, headers: { 'Cache-Control': 'public, max-age=3600' } },
      '/api/**': { cors: true, headers: { 'Cache-Control': 'public, max-age=300' } },
      '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
    }
  },

  // Modules optimisés pour Netlify
  modules: [
    '@nuxt/image',                      // CDN et optimisation images
    '@nuxtjs/tailwindcss',
    '@nuxtjs/cloudinary',
    '@pinia/nuxt',
    '@hebilicious/vue-query-nuxt'
  ],

  // Configuration des images pour Netlify CDN
  image: {
    providers: {
      netlify: {}
    },
    domains: [
      'res.cloudinary.com',             // Cloudinary
      'images.unsplash.com'             // Autres CDN
    ],
    presets: {
      cover: {
        modifiers: {
          format: 'auto',
          quality: 'auto:good',
          fit: 'cover'
        }
      }
    }
  },

  // Configuration Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  },

  // Runtime config pour variables d'environnement
  runtimeConfig: {
    // Privé (server-side seulement)
    turso: {
      databaseUrl: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    smtpHost: process.env.SMTP_HOST,
    smtpPassword: process.env.SMTP_PASSWORD,

    // Public (client + server)
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://your-site.netlify.app",
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    }
  }
})
```

---

## 🚀 Variables d'Environnement

### Configuration via Interface Netlify

1. **Connectez-vous** à https://app.netlify.com
2. **Sélectionnez** votre site
3. **Naviguez** : Site settings → Environment variables
4. **Ajoutez** les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NODE_VERSION` | `18` | Version Node.js |
| `PNPM_FLAGS` | `--shamefully-hoist` | **Obligatoire** pour pnpm workspaces |
| `TURSO_DATABASE_URL` | `libsql://...` | Base de données Turso |
| `TURSO_AUTH_TOKEN` | `eyJhbGci...` | Token d'authentification Turso |
| `CLOUDINARY_CLOUD_NAME` | `dsrvzogof` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | `775318993136791` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | `ywTgN-mioXQXW1lOWmq2xNAIK7U` | Secret API Cloudinary |
| `SMTP_HOST` | `mail.topdigitalevel.site` | Serveur SMTP |
| `SMTP_PORT` | `587` | Port SMTP |
| `SMTP_USERNAME` | `info@topdigitalevel.site` | Nom d'utilisateur SMTP |
| `SMTP_PASSWORD` | `undPzZ3x3U` | Mot de passe SMTP |
| `SMTP_SECURE` | `tls` | Sécurité SMTP |
| `NUXT_PUBLIC_SITE_URL` | `https://your-site.netlify.app` | URL publique du site |

### Configuration via Netlify CLI

```bash
# Installation
npm install -g netlify-cli

# Connexion et liaison
netlify login
netlify link

# Ajout des variables
netlify env:set TURSO_DATABASE_URL "libsql://..."
netlify env:set TURSO_AUTH_TOKEN "eyJhbGci..."
netlify env:set CLOUDINARY_CLOUD_NAME "dsrvzogof"
# ... etc pour toutes les variables
```

---

## 🏃‍♂️ Processus de Déploiement

### 1. Préparation du Repository

```bash
# Vérifier la structure
git status

# S'assurer que netlify.toml est à la racine
ls -la netlify.toml

# Vérifier le build local
pnpm build --filter=@ns2po/election-mvp
```

### 2. Liaison GitHub → Netlify

1. **Connectez** votre repository GitHub à Netlify
2. **Sélectionnez** la branche `main` ou `master`
3. **Vérifiez** la configuration de build automatiquement détectée

### 3. Premier Déploiement

1. **Configurez** toutes les variables d'environnement
2. **Déclenchez** un déploiement manuel
3. **Surveillez** les logs de build
4. **Testez** l'application déployée

### 4. Configuration Post-Déploiement

```bash
# Récupérer l'URL finale
netlify open

# Mettre à jour NUXT_PUBLIC_SITE_URL avec l'URL Netlify
netlify env:set NUXT_PUBLIC_SITE_URL "https://your-actual-url.netlify.app"

# Redéclencher un déploiement
netlify deploy --prod
```

---

## 🎯 Optimisations de Performance

### Build Optimizations

```toml
[build.environment]
  # Cache des dépendances
  NPM_CONFIG_CACHE = "/opt/buildhome/.npm"
  PNPM_STORE_PATH = "/opt/buildhome/.pnpm-store"

  # Optimisations Node.js
  NODE_OPTIONS = "--max-old-space-size=4096"
```

### Image Optimization

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  image: {
    // Utiliser Netlify Large Media pour les images
    netlify: {
      baseURL: process.env.NUXT_PUBLIC_SITE_URL
    },
    // Format moderne par défaut
    format: ['webp', 'avif', 'auto'],
    // Responsive par défaut
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    }
  }
})
```

### CDN et Cache

```javascript
// Utilisation des Edge Functions pour l'API
export default defineEventHandler(async (event) => {
  // Cache API response
  setHeaders(event, {
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'Vary': 'Accept-Encoding'
  })

  return { data: 'cached response' }
})
```

---

## 🔍 Troubleshooting

### Erreurs Communes

#### 1. Build Failed - PNPM Dependencies
```bash
Error: Cannot resolve workspace dependencies
```
**Solution :**
```toml
[build.environment]
PNPM_FLAGS = "--shamefully-hoist"
```

#### 2. 404 - Site Not Found
```
Publish directory is empty or doesn't exist
```
**Solutions :**
- Vérifier `publish = "apps/election-mvp/.output/public"`
- S'assurer que le build génère `.output/public`
- Éviter les symlinks absolus

#### 3. Function Deployment Failed
```
Serverless functions not detected
```
**Solution :**
```toml
[functions]
directory = "apps/election-mvp/.output/server"
```

#### 4. Environment Variables Not Loaded
```
Cannot read property of undefined
```
**Solutions :**
- Vérifier que toutes les variables sont définies sur Netlify
- Utiliser `runtimeConfig` dans Nuxt au lieu de `process.env` côté client
- Préfixer les variables publiques avec `NUXT_PUBLIC_`

### Debugging Commands

```bash
# Vérifier les variables d'environnement
netlify env:list

# Logs de déploiement
netlify logs:deploy

# Logs des fonctions
netlify logs:functions

# Test local avec environnement Netlify
netlify dev
```

---

## ✅ Checklist Pré-Déploiement

- [ ] **netlify.toml** configuré avec le bon `publish` directory
- [ ] **PNPM_FLAGS** défini sur `--shamefully-hoist`
- [ ] **Variables d'environnement** toutes configurées sur Netlify
- [ ] **Build local** fonctionne : `pnpm build --filter=@ns2po/election-mvp`
- [ ] **Preview local** fonctionne : `cd apps/election-mvp && pnpm preview`
- [ ] **Pas de symlinks absolus** dans `.output/public`
- [ ] **Images externes** ajoutées dans `image.domains`
- [ ] **Repository GitHub** connecté à Netlify
- [ ] **Branche de déploiement** définie (main/master)

---

## 📚 Ressources Utiles

### Documentation Officielle
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Nuxt 3 Deployment](https://nuxt.com/docs/getting-started/deployment#netlify)
- [PNPM Workspaces](https://pnpm.io/workspaces)

### Outils de Debug
- [Netlify Build Logs](https://app.netlify.com)
- [Netlify CLI](https://cli.netlify.com)
- [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse)

### Support Communauté
- [Netlify Community Forum](https://community.netlify.com)
- [Nuxt Discord](https://discord.com/invite/ps2h6QT)

---

## 🎉 Conclusion

Ce guide couvre les aspects essentiels du déploiement d'un monorepo Nuxt 3 avec pnpm sur Netlify en 2025.

**Points clés à retenir :**
- **PNPM_FLAGS --shamefully-hoist** est obligatoire
- **Éviter les symlinks absolus** dans le publish directory
- **Configurer correctement** les variables d'environnement
- **Optimiser les images** avec Netlify Image CDN
- **Utiliser le preset node-server** pour SSR

Pour toute question ou problème spécifique, consultez les logs de déploiement Netlify et la documentation officielle.

---

*Guide créé pour NS2PO Election MVP - Optimisé pour les meilleures pratiques 2025*