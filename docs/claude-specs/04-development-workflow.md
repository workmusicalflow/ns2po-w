# Workflow de Développement NS2PO

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
- **Unitaires** : Vitest pour la logique métier
- **E2E** : Playwright pour les parcours critiques
- **Commande** : `pnpm test` (toujours exécuter avant les commits)

### Vérification TypeScript
```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && pnpm exec tsc --noEmit
```

## Standards de Qualité

### Code Style
- **TypeScript strict** activé partout
- **ESLint + Prettier** automatiques via Husky
- **Conventional Commits** obligatoires
- **Vue/Nuxt conventions** respectées

### Patterns à Suivre
1. **Composants** : Pascal Case (`ButtonPrimary.vue`)
2. **Composables** : Camel Case préfixé `use` (`useProductCalculator`)
3. **Types** : Interface préfixée `I` (`IProduct`, `IQuoteRequest`)
4. **Fichiers** : Kebab case (`product-catalog.vue`)

## Workflow Git

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

## Outils MCP Disponibles

### Serveurs MCP Prioritaires
- `mcp__task-master` : Gestion des tâches
- `mcp__gemini-copilot` : Sessions conversationnelles
- `mcp__gpt5-copilot` : IA avancée
- `mcp__context7` : Documentation bibliothèques
- `mcp__terminal-observer` : Commandes longues
- `mcp__docusync-ai` : Synchronisation documentation
- `mcp__git-master` : Opérations Git
- `mcp__airtable` : Gestion CMS
- `mcp__firecrawl` : Web scraping

### GitHub Actions
Utiliser `mcp__github-actions-mcp` pour interagir avec les workflows CI/CD

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