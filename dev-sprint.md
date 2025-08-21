# Plan du Sprint 0 : Les Fondations Techniques

**Objectif du Sprint :** Mettre en place une base de code saine, un pipeline CI/CD fonctionnel et une expérience de développement (DevExp) de premier ordre pour accélérer les futurs développements.

**Durée :** 1 semaine

## ✅ Objectifs Clés à Atteindre

1. Le monorepo est initialisé et tout développeur peut lancer le projet avec 3 commandes.
2. Le pipeline de CI/CD sur Vercel est fonctionnel : une PR génère une URL de prévisualisation.
3. Les standards de qualité (linting, formatage, typage) sont automatisés et obligatoires.
4. L'application `election-mvp` est créée et peut afficher un composant partagé depuis le package `ui`.

## 📋 Tâches du Sprint

| Tâche                                 | Description                                                                                                                     | Critères d'Acceptation ("Done is when...")                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Setup-1 : Monorepo**                | Initialiser le projet avec pnpm workspaces et Turborepo. Définir la structure des dossiers `apps` et `packages`.                | `pnpm install` et `pnpm dev` fonctionnent sans erreur.                                         |
| **Setup-2 : CI/CD Vercel**            | Connecter le repo GitHub/GitLab à Vercel. Configurer Vercel pour qu'il comprenne le monorepo (Root Directory, Build commands).  | Une Pull Request sur `main` déploie automatiquement une URL de prévisualisation fonctionnelle. |
| **DevExp-1 : Qualité du Code**        | Mettre en place ESLint, Prettier, et TypeScript. Configurer Husky et lint-staged pour forcer la qualité avant chaque `commit`.  | Un `git commit` échoue si le code contient des erreurs de linting ou de formatage.             |
| **App-1 : Initialisation Nuxt**       | Créer l'application `apps/election-mvp` avec Nuxt 3. Configurer le layout de base et une page d'accueil simple ("Hello World"). | L'application est accessible sur `localhost:3000` via `pnpm dev`.                              |
| **Package-1 : UI Library**            | Créer le package `@ns2po/ui`. Développer un premier composant partagé `Button.vue` documenté avec Storybook.                    | Le composant `Button` est visible dans Storybook.                                              |
| **Package-2 : Types partagés**        | Créer le package `@ns2po/types`. Définir les premières interfaces TypeScript (ex: `IProduct`, `IQuoteRequest`).                 | Les types sont importables dans `election-mvp` et `ui` sans erreur.                            |
| **Integration-1 : Composant Partagé** | Importer et utiliser le `Button.vue` de `@ns2po/ui` dans la page d'accueil de `election-mvp`.                                   | Le bouton s'affiche correctement sur la page d'accueil de l'application Nuxt.                  |
| **Docs-1 : Documentation Initiale**   | Rédiger la première version du `README.md` et du `CONTRIBUTING.md`.                                                             | Les documents sont présents dans la branche `main` et validés par l'équipe.                    |

## 🎯 Critères de Réussite du Sprint

À la fin de ce sprint, nous devons être capables de :

- ✅ Cloner le repo et lancer l'application en moins de 5 minutes
- ✅ Voir une page web fonctionnelle avec un composant partagé
- ✅ Créer une Pull Request qui génère automatiquement un déploiement
- ✅ Avoir confiance dans la qualité du code grâce aux outils automatisés

## 🚀 Sprint suivant

Le Sprint 1 se concentrera sur l'implémentation des fonctionnalités métier du MVP :
- Catalogue de produits connecté à Airtable
- Interface de personnalisation
- Système de génération de devis