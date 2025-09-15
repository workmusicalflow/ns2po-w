# CLAUDE.md - Guide Principal NS2PO

## 📋 Vue d'ensemble

Ce guide principal référence une documentation modulaire pour faciliter la navigation et la maintenance.

## 📚 Documentation Modulaire

### Spécifications Principales

1. **[Contexte du Projet](./docs/claude-specs/01-project-context.md)**
   - Vue d'ensemble NS2PO
   - Objectifs MVP
   - Philosophie de développement
   - Anti-patterns à éviter

2. **[Architecture Technique](./docs/claude-specs/02-tech-stack.md)**
   - Stack technologique complet
   - Structure des dossiers
   - Intégrations externes
   - Technologies clés

3. **[Design System](./docs/claude-specs/03-design-system.md)**
   - Identité visuelle
   - Palette de couleurs
   - Typographie
   - Composants UI

4. **[Workflow de Développement](./docs/claude-specs/04-development-workflow.md)**
   - Commandes principales
   - Standards de qualité
   - Workflow Git
   - Outils MCP

5. **[Fonctionnalités MVP](./docs/claude-specs/05-features-mvp.md)**
   - Catalogue de produits
   - Campaign Bundles
   - Assets Management
   - Composables métier

6. **[Configuration & Environnement](./docs/claude-specs/06-environment-config.md)**
   - Variables d'environnement
   - Sécurité
   - Scripts de maintenance
   - Architecture de données

7. **[Monitoring SonarCloud](./docs/claude-specs/07-monitoring-sonarcloud.md)**
   - Configuration SonarCloud
   - Métriques clés
   - Workflow post-push
   - Quality Gate

## 🚀 Commandes Rapides

```bash
# Démarrage développement
pnpm dev

# Build et vérification
pnpm build
pnpm exec tsc --noEmit

# Tests complets
pnpm test
node scripts/test-campaign-bundles-integration.mjs

# Migration Campaign Bundles
node scripts/migrate-campaign-bundles-to-airtable.mjs --dry-run
```

## 🛠️ Serveurs MCP Disponibles

**Prioritaires** :
- `mcp__task-master` : Gestion des tâches
- `mcp__gemini-copilot` / `mcp__gpt5-copilot` : Sessions IA
- `mcp__context7` : Documentation bibliothèques
- `mcp__terminal-observer` : Commandes longues
- `mcp__docusync-ai` : Synchronisation documentation

**Spécialisés** :
- `mcp__git-master` : Opérations Git
- `mcp__airtable` : Gestion CMS
- `mcp__firecrawl` : Web scraping
- `mcp__github-actions-mcp` : CI/CD

## 📊 Métriques de Qualité

- **SonarCloud** : Quality Gate ✅ PASSED obligatoire
- **TypeScript** : Strict mode, zéro erreur
- **Tests** : E2E Playwright pour parcours critiques
- **Performance** : Bundle < 250KB, FCP < 2s

## 🔧 Scripts Spécialisés

### Campaign Bundles
```bash
# Migration données statiques → Airtable
node scripts/migrate-campaign-bundles-to-airtable.mjs [--dry-run]

# Validation post-migration
node scripts/validate-campaign-bundles-migration.mjs

# Tests d'intégration complets
node scripts/test-campaign-bundles-integration.mjs [--verbose]
```

### Assets Management
```bash
# CLI de gestion des assets
node scripts/asset-manager.mjs <add|remove|sync> [options]

# Upload photos équipe
node scripts/upload-team-photos.mjs
```

## ⚡ Instructions Spéciales

### Utilisation des MCP
- **Toujours** utiliser `terminal-observer` pour les commandes longues
- **Consulter** `context7` pour la documentation à jour des bibliothèques
- **Étendre** la collaboration via `gemini-copilot` et `gpt5-copilot` pour les avis experts

### DevExp Optimale
- Exploiter pleinement les serveurs MCP disponibles
- Maintenir une approche mobile-first
- Préserver la performance et l'accessibilité
- Documenter automatiquement avec `docusync-ai`

---

**Important** : Cette documentation modulaire facilite la maintenance et évite la duplication. Chaque fichier de spécification est autonome et peut être référencé indépendamment.