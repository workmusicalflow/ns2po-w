# Guide de Contribution

Merci de vouloir contribuer à la plateforme NS2PO ! Ce guide définit les standards et les processus à suivre pour garantir un développement fluide et de haute qualité.

## 💬 Communication

- **Canal principal :** [Lien vers votre Slack/Discord/Teams #channel]
- **Suivi des tâches :** [Lien vers Trello/Jira/Notion]
- **Questions techniques :** Posez-les dans le canal public pour que tout le monde puisse en bénéficier.

## 🌳 Flux de Travail Git

Nous utilisons un flux de travail simple basé sur des branches de fonctionnalités.

1. **Création de branche :**
   Toute nouvelle fonctionnalité ou correction de bug doit être développée dans sa propre branche. Le nom de la branche doit suivre ce format :
   `[type]/[ticket-id]-[description-courte]`

   - **Types :** `feat`, `fix`, `chore`, `docs`
   - **Exemples :** `feat/TIX-101-creation-formulaire-devis`, `fix/TIX-102-bouton-non-responsive`

2. **Messages de Commit :**
   Nous suivons la spécification **Conventional Commits**. Cela nous permet de générer des changelogs automatiquement et de garder un historique clair.

   - **Format :** `type(scope): description`
   - **Exemples :**
     - `feat(devis): add real-time price calculation`
     - `fix(ui): correct button padding on mobile`
     - `docs(readme): update setup instructions`

3. **Pull Requests (PR) :**
   - Une PR doit être petite et se concentrer sur **une seule tâche**.
   - La description de la PR doit expliquer **ce que fait le code et pourquoi**. Liez le ticket correspondant.
   - Assurez-vous que tous les tests et les vérifications de linting passent avant de demander une revue.
   - Au moins **un autre développeur** doit approuver la PR avant la fusion.

## ⌨️ Standards de Code

- **Langage :** TypeScript partout où c'est possible.
- **Formatage :** Le code est automatiquement formaté par **Prettier** à chaque commit.
- **Qualité :** Le code est vérifié par **ESLint** à chaque commit. Aucune erreur ne doit être tolérée.
- **Style :** Nous suivons les conventions recommandées pour Vue/Nuxt et TypeScript.

## 🧪 Tests

- Toute nouvelle logique métier critique (ex: calcul de devis) **doit** être couverte par des tests unitaires (`.spec.ts`) avec **Vitest**.
- Les parcours utilisateurs critiques feront l'objet de tests de bout en bout (E2E) avec **Playwright**.

## 📦 Structure des Packages

### Monorepo Organisation

Notre monorepo est organisé en packages réutilisables :

- **`@ns2po/ui`** : Composants Vue partagés
- **`@ns2po/types`** : Types TypeScript partagés
- **`@ns2po/config`** : Configurations ESLint, Prettier, etc.
- **`@ns2po/composables`** : Hooks Vue réutilisables

### Ajout d'un Nouveau Package

1. Créer le dossier dans `packages/[nom-package]`
2. Ajouter un `package.json` avec le nom `@ns2po/[nom-package]`
3. Mettre à jour `pnpm-workspace.yaml` si nécessaire
4. Documenter le package dans le README principal

## 🔍 Processus de Review

1. **Auto-review** : Relisez votre code avant de créer la PR
2. **Tests** : Vérifiez que tous les tests passent
3. **Documentation** : Mettez à jour la documentation si nécessaire
4. **Demande de review** : Assignez au moins un reviewer expérimenté

## 🚀 Déploiement

- **Staging** : Chaque PR génère automatiquement un déploiement de preview
- **Production** : Seules les PR mergées dans `main` sont déployées en production
- **Rollback** : En cas de problème, contactez immédiatement l'équipe tech

En suivant ces règles, nous construirons ensemble une base de code propre, maintenable et évolutive.