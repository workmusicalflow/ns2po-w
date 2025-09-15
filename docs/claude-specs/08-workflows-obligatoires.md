# Workflows de Développement Obligatoires

## 💡 Stratégie de "Correction Ciblée et Incrémentale"

Lorsque vous ajoutez de nouvelles fonctionnalités ou effectuez des refactorings, des erreurs de linting ou de typage sont inévitables. Pour éviter d'être submergé, vous devez adopter une **approche de correction ciblée et incrémentale**.

### Principe Fondamental

Toujours **isoler et corriger la qualité du code d'une fonctionnalité spécifique AVANT** de lancer des vérifications globales (`pnpm run build` ou `pnpm run test:all`) sur l'ensemble du projet.

### Workflow de Correction Ciblée

1. **Identifier le Périmètre**
   - Après avoir généré le code pour une tâche, identifiez la liste précise des fichiers que vous avez créés ou modifiés
   - Documentez ces fichiers pour traçabilité

2. **Lancer une Analyse Ciblée**
   - Utilisez le serveur MCP `eslint-master` pour lancer une analyse **uniquement** sur ces fichiers
   - **Commande** : `eslint-master lint_files --cwd <racine_projet> --filePaths [liste_des_fichiers]`

3. **Corriger par Lots**
   - **Étape 1** : Utilisez `eslint-master fix_files` pour corriger automatiquement ce qui peut l'être
   - **Étape 2** : Pour les erreurs restantes, analysez le rapport JSON et corrigez-les avec des outils précis comme `serena` (`replace_symbol_body`, `insert_after_symbol`)
   - **Important** : Toujours corriger manuellement les erreurs critiques après les fixes automatiques

4. **Valider la Correction**
   - Relancez `eslint-master lint_files` sur le même périmètre pour confirmer que toutes les erreurs spécifiques à cette fonctionnalité sont résolues
   - Vérifiez avec TypeScript : `pnpm exec tsc --noEmit`

5. **Intégration Globale**
   - Ce n'est qu'une fois que la nouvelle fonctionnalité est "propre" que vous pouvez procéder aux vérifications globales
   - `pnpm build` et `pnpm test` sur l'ensemble du projet

## ✅ Qualité de Code & Conventions

### Standards Obligatoires

- **TypeScript strict** : Obligatoire partout, zéro erreur de compilation
- **ESLint** : Tout le code doit passer `pnpm lint` avant commit
- **Prettier** : Formatage automatique avec `pnpm lint:fix`

### Règles de Complexité

- **Complexité cyclomatique** max : **10**
- **Complexité cognitive (SonarJS)** max : **15**
- **Pas de duplication** de code ou de chaînes de caractères
- **Couverture de tests** : minimum 80% pour nouveau code

### Conventions de Nommage

```typescript
// Fichiers : kebab-case
user-service.ts
campaign-bundles-data.ts

// Classes/Interfaces : PascalCase
class UserService {}
interface CampaignBundle {}

// Variables/Fonctions : camelCase
const campaignBundles = []
function getCampaignBundle() {}

// Constantes : UPPER_SNAKE_CASE
const DEFAULT_TTL = 15 * 60 * 1000
const MAX_CACHE_SIZE = 100
```

### Conventions Framework

#### Nuxt.js/Vue.js
```vue
<!-- Toujours utiliser <script setup lang="ts"> -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props avec types stricts
interface Props {
  title: string
  isActive?: boolean
}

const props = defineProps<Props>()
</script>
```

#### Architecture Composables
```typescript
// Structure standard d'un composable
export const useFeatureName = () => {
  // État réactif
  const data = ref<DataType[]>([])
  const loading = ref(false)
  const error = ref('')

  // Computed properties
  const processedData = computed(() => {
    // logique de transformation
  })

  // Méthodes
  const fetchData = async () => {
    // logique métier
  }

  // Return API
  return {
    // État (readonly)
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    processedData,

    // Actions
    fetchData
  }
}
```

## 🧠 Mémoires et Instructions Spécifiques

### Utilisation Terminal Observer
```bash
# ✅ CORRECT - Toujours utiliser le paramètre cwd
terminal-observer --cwd /path/to/project command

# ❌ INCORRECT - N'utilisez jamais cd && dans le command
terminal-observer "cd /path/to/project && command"
```

### Débogage Collaboratif
- **Problèmes complexes** : Utilisez `gemini-copilot` dans une session persistante
- **Contexte riche** : Fournissez toujours un contexte détaillé et mettez-le à jour continuellement
- **Expertise externe** : Combinez `gemini-copilot` + `gpt5-copilot` pour des avis croisés

### Navigation et Refactoring Sémantique

#### Utilisation de Serena
```typescript
// Pour toutes les opérations de navigation et refactoring
// ✅ Recherche de symboles
serena find_symbol --name_path "useCampaignBundles"

// ✅ Remplacement de code
serena replace_symbol_body --name_path "functionName" --relative_path "file.ts"

// ✅ Insertion de code
serena insert_after_symbol --name_path "lastFunction" --relative_path "file.ts"
```

#### Utilisation de Context7
```typescript
// ✅ Validation des connaissances sur les bibliothèques
context7 resolve-library-id --libraryName "nuxt"
context7 get-library-docs --context7CompatibleLibraryID "/vercel/next.js"
```

### Principe de Pragmatisme

**Avant d'implémenter une nouvelle tâche** :

1. **Rechercher l'existant** avec `serena find_symbol` ou `grep`
2. **Vérifier les composables** existants dans `/composables`
3. **Examiner les patterns** similaires dans le projet
4. **Ne pas réinventer la roue** : réutiliser et étendre l'existant

### Workflow Type pour une Nouvelle Fonctionnalité

```bash
# 1. Recherche préliminaire
serena search_for_pattern --substring_pattern "similar-feature"

# 2. Développement ciblé
# (créer/modifier les fichiers)

# 3. Analyse qualité ciblée
eslint-master lint_files --cwd . --filePaths ["nouveau-fichier.ts", "fichier-modifie.vue"]

# 4. Correction automatique
eslint-master fix_files --cwd . --filePaths ["nouveau-fichier.ts", "fichier-modifie.vue"]

# 5. Correction manuelle des erreurs critiques
serena replace_symbol_body --name_path "problematic-function" --relative_path "file.ts"

# 6. Validation ciblée
eslint-master lint_files --cwd . --filePaths ["nouveau-fichier.ts", "fichier-modifie.vue"]
pnpm exec tsc --noEmit

# 7. Tests spécifiques
pnpm test nouvea-feature.test.ts

# 8. Intégration globale
pnpm build
pnpm test
```

## 🎯 Métriques de Qualité Obligatoires

### Avant chaque commit
- ✅ ESLint : Zéro erreur
- ✅ TypeScript : Zéro erreur de compilation
- ✅ Tests : Tous les tests passent
- ✅ Build : Compilation réussie

### Avant chaque push
- ✅ SonarCloud Quality Gate : PASSED
- ✅ E2E tests : Parcours critiques validés
- ✅ Performance : Bundle size < 250KB