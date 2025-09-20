# Projet NS2PO Élections MVP

## Contexte

PMI ivoirienne de publicité par l'objet depuis 2011, NS2PO digitalise son offre via une plateforme MVP ciblée pour les élections : génération de devis et précommande de gadgets personnalisés.

## Objectifs

* MVP simple, rapide, sans authentification utilisateur prématurée
* Optimiser images avec Cloudinary pour performance mobile
* Implémenter tests E2E critiques Playwright sur parcours devis
* Éviter dette technique, over-engineering et sous-exploitation des MCP serveurs

## Architecture

* **Frontend** : Nuxt 3 + Vue 3 + TypeScript + Tailwind + HeadlessUI
* **Backend** : API Routes Nuxt + Turso (SQLite)
* **Migration** : Airtable → Turso (cache performant)
* **Admin CMS** : Mini-CMS sécurisé `/admin` avec Shadcn-vue + authentification middleware
* **Médias** : Cloudinary (upload, optimisation, transformation)
* **Déploiement** : Vercel, monorepo Turborepo + pnpm workspaces
* **Outils clés** : Drizzle ORM pour base typée, Nitro-cache, Playwright, Vitest

## Design System

### Couleurs principales
* **Primaire** : `#C99A3B` (Ocre)
* **Accent** : `#6A2B3A` (Bourgogne)
* **Fond** : `#F8F8F8`
* **Texte** : `#2D2D2D`

### Typographie
* **Titres** : Poppins (gras, condensé)
* **Corps** : Inter (lisible)

Configuration Tailwind avec tokens CSS variables pour couleurs et polices.

## Fonctionnalités MVP

* Catalogue produits depuis Turso Database (abandon Airtable complet)
* Personnalisation visuelle avec upload logos (Cloudinary, Canvas)
* Génération devis dynamique, export PDF, sauvegarde Turso
* Formulaires validés (Zod, Vee-Validate), envoi API Nuxt

## Mini-CMS Administration ✨

### Architecture `/admin`
* **Interface** : Dashboard sécurisé avec stats temps réel (produits, bundles, sync)
* **Authentification** : Middleware avec bypass développement (`admin@ns2po.com` / `admin123`)
* **UI Framework** : Shadcn-vue (alternative gratuite à Nuxt UI Pro)
* **Layout** : Navigation sidebar dédiée avec branding NS2PO
* **Composants** : DataTable, FormField, Modal réutilisables

### Fonctionnalités CMS
* **Monitoring** : Health check Turso, statistiques performance
* **Gestion données** : CRUD produits, bundles, catégories via Turso
* **Navigation** : Dashboard, Products, Bundles, Categories, Settings
* **APIs intégrées** : `/api/products`, `/api/campaign-bundles`, `/api/categories`, `/api/health`

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
* **Serena** : Agent de développement sémantique - Analyse intelligente de code, refactoring automatisé, navigation par symboles, édition contextuelle. Idéal pour compréhension de codebase complexe et modifications précises.
* **Context7** : Documentation à jour des technologies (Nuxt, Vue.js) pour éviter les hallucinations et améliorer la pertinence du code généré.

### Project Management
* **Task Master** : Gestion de projets et tâches structurées avec tracking de progression.
* **Pareto Planner** : Planification 80/20 pour priorisation intelligente des tâches.

### Infrastructure
* **Git Master** : Opérations Git avancées et gestion des branches.
* **Docker Master** : Gestion containers et images Docker.
* **Turso Cloud** : Interface avec base de données Turso.
* **Airtable** : Intégration API pour CMS et données structurées.

### Development Tools
* **ESLint Master** : Analyse et correction automatique du code.
* **Gemini Copilot** : Assistant IA Google pour génération de code.
* **GPT5 Copilot** : Assistant IA OpenAI pour développement.

### Assets & Content
* **Cloudinary** : Gestion et optimisation d'images/vidéos.
* **DocuSync** : Synchronisation automatique de documentation.

**Usage recommandé** : Utiliser `mcp__












__` pour analyse de code complexe, `mcp__context7__` pour documentation framework, `mcp__task-master__` pour gestion projet.

**✨ Réussite récente** : `mcp__perplexity-copilot__` utilisé avec succès pour rechercher alternative gratuite à Nuxt UI Pro → recommandation Shadcn-vue implémentée dans Mini-CMS `/admin`.

## Repository

https://github.com/workmusicalflow/ns2po-w.git

---

## 🚀 MIGRATION AIRTABLE → TURSO - STATUS TEMPS RÉEL

<!-- START_SECTION:migration_status -->
<!-- CONTENU AUTO-GÉNÉRÉ - NE PAS MODIFIER MANUELLEMENT -->
**Infrastructure Turso** : ✅ Opérationnelle (ns2po-election-mvp)
**Migration Progress** : 24% terminé (infrastructure découverte)
**Timeline** : 1-2 semaines (accélérée)
**Prochaine tâche** : Configuration client Nuxt (Tâche #2)
**Status MCP** : Utiliser `mcp__task-master__next_task` dans Claude Code
**Dernière mise à jour** : 2025-09-17 01:53
<!-- END_SECTION:migration_status -->

### 📊 Infrastructure Découverte (2025-01-17)

**RÉVÉLATION MAJEURE** : Base Turso `ns2po-election-mvp` déjà opérationnelle !

## 🏥 INFRASTRUCTURE STATUS - AUTO-GÉNÉRÉ

<!-- START_SECTION:infrastructure -->
<!-- CONTENU AUTO-GÉNÉRÉ - NE PAS MODIFIER MANUELLEMENT -->
- **Turso** : ✅ Connecté (ns2po-election-mvp)
- **Variables Env** : ✅ TURSO_DATABASE_URL, ⚠️ AIRTABLE_API_KEY (migration), ✅ CLOUDINARY_CLOUD_NAME, ⚠️ AIRTABLE_API_KEY (migration)
- **Git** : ✅ 20 fichier(s) modifié(s)
<!-- END_SECTION:infrastructure -->

## 💻 COMMANDES ESSENTIELLES - AUTO-GÉNÉRÉ

<!-- START_SECTION:essential_commands -->
<!-- CONTENU AUTO-GÉNÉRÉ - NE PAS MODIFIER MANUELLEMENT -->
### 🚀 Migration Airtable→Turso (MCP)
```typescript
// Appels MCP Task Master (dans Claude Code)
mcp__task-master__check_project_status    // État projet
mcp__task-master__next_task               // Prochaine tâche
mcp__task-master__update_task             // Mise à jour tâche
mcp__task-master__list_tasks              // Liste complète
```

### 🏗️ Infrastructure Turso
```bash
turso auth login                          # Authentification
turso db shell ns2po-election-mvp         # Accès base
turso db show ns2po-election-mvp          # Détails infra
```

### 💻 Développement Nuxt
```bash
pnpm dev                                  # Serveur dev
pnpm type-check                           # Validation TS
pnpm add @libsql/client                   # Client Turso
```

### 📊 Qualité Code
```bash
pnpm lint                                 # ESLint check
pnpm test                                 # Tests unitaires
pnpm test:e2e                            # Tests E2E
```
<!-- END_SECTION:essential_commands -->

## 🗓️ TIMELINE PROJET - AUTO-GÉNÉRÉ

<!-- START_SECTION:timeline -->
<!-- CONTENU AUTO-GÉNÉRÉ - NE PAS MODIFIER MANUELLEMENT -->
### 🎯 Timeline Migration Accélérée

**Phase Actuelle** : Configuration Nuxt Client (Sprint 1)
**Durée restante** : 1-2 semaines (au lieu de 4)
**Économie prévue** : 240€/an dès Go-Live

**Prochaines étapes** :
1. **Tâche #2** : Configuration client Nuxt Turso (0.5j)
2. **Tâche #21** : Audit compatibilité app (0.5j)
3. **Sprint 2** : API hybride + Go-Live (3-5j)

**Documentation** :
- Plan complet : `docs/MIGRATION-AIRTABLE-TURSO-PLAN.md`
- Sprint planning : `docs/SPRINT-PLANNING-MIGRATION.md`

**Dernière update** : 2025-09-17 01:53
<!-- END_SECTION:timeline -->

### 🎯 Prochaine Action Critique
**Tâche #2** : Configuration client Nuxt Turso (0.5 jour)
- Installer `@libsql/client`
- Créer `server/utils/turso.ts`
- Connecter à base existante : `libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io`

**🎯 OBJECTIF IMMÉDIAT** : Démarrer configuration Nuxt pour Go-Live sous 10 jours !

<!-- DYNAMIC_CONTENT_START -->
<!-- Generated: 2025-09-20T21:37:06.414272 -->
<!-- This content is automatically updated -->

## 🏗️ Project Information

**Type**: Monorepo
**Language**: Javascript
**Monorepo**: pnpm

## 📊 Git Repository Status

**Branch**: `main`
**Modified Files**: 30
**Repository**: https://github.com/workmusicalflow/ns2po-w.git

### Recent Commits
- 076003c feat(task-master): create CRUD Categories project with Core 20% / 80% Enhancement roadmap
- 52fc1fa feat(admin): enhance bundle form validation and notification system
- 0162b5f fix(admin): resolve bundle creation form critical issues
- 043a1d4 feat(ux): implement Core 20% UX enhancements for réalisations management
- 47dc51d feat(admin): implement complete CRUD form components system with Zod validation

## 📦 Package Management

**Manager**: pnpm
**Dependencies**: 7
**Workspaces**: 2

## 🔧 Environment & Services

**Config Files**: 3
**Services**: Turso, Database, Cloudinary, Airtable

## 🚀 Available Commands

### Build
- `build: turbo build`

### Dev
- `dev: turbo dev`

### Lint
- `lint: turbo lint`
- `format: prettier --write .`
- `format:check: prettier --check .`

### Other
- `type-check`
- `clean`
- `assets:add`
- `assets:remove`
- `assets:update`
- _3 more..._

### Test
- `test: turbo test`
- `test:coverage: turbo test:coverage`

**Sources**: package.json

## 🏥 Project Health

### Status Checks
- **Git**: ✅
- **Dependencies**: ✅

### ⚠️ Issues
- 18 TODO/FIXME comments

## 🤖 MCP Servers

**Available Servers**: 16

### Core Development
- **Context7**: Documentation framework temps réel (Nuxt, Vue, React) ✓

### Project Management
- **Pareto Planner**: Planification 80/20 pour priorisation intelligente ✓
- **Task Master V3** ✓

### Infrastructure
- **Docker Master**: Gestion containers Docker, images, registres ✓
- **Git Master**: Opérations Git avancées, branches, commits, historique ✓

### AI Assistants
- **Gemini Copilot**: Assistant IA Google - génération code, sessions, multimodal ✓
- **Gpt5 Copilot**: Assistant IA OpenAI - développement, sessions, uploads ✓
- **Perplexity Copilot**: Recherche web IA temps réel, sessions persistantes, 5 modèles (sonar, reasoning) ✓

### Testing & Quality
- **Eslint Master**: Analyse et correction automatique code JavaScript/TypeScript ✓
- **Code Critique**: Analyse et amélioration qualité code ✓
- **Playwright**: Tests E2E browser automation - capture, interaction, assertions ✓

### Browser & Web
- **Firecrawl**: Extraction contenu web structuré, scraping, crawling ✓
- **Browser Automation**: Automatisation navigateur - contrôle, scraping, tests ✓

### Cloud Services
- **Airtable**: API Airtable - bases, tables, records, recherche ✓
- **Docusync**: Synchronisation documentation automatique ✓

### Other Tools
- **Monorepo Manager**: Gestion monorepo - analyse structure, dépendances ✓

## 📈 Recent Activity

**Active Areas**: session_95d62979-9ae8-4d57-8bd0-0f5a7c17413b.json, session_b8ad36e9-e474-48bf-be73-5dadcae5d2e6.json, session_f96d224b-0edb-4567-ab97-95f2c0c95662.json, election-mvp, types

### Recently Modified
- ./.gemini-request-history.json
- ./.serena/cache/typescript/document_symbols_cache_v23-06-25.pkl
- ./.claude/settings.local.json
- ./.claude/hooks/context_updater.log
- ./.claude-task-master/config.json

<!-- DYNAMIC_CONTENT_END -->
- avant de démarrer le serveur de developpement en arrière plan veuillez toujours vérifier s'il nst pas déjà actif. si besoin vous arrêter le ou les serveur actif et relancez proprement.