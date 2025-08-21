# NS2PO - Plateforme Digitale Modulaire

![NS2PO Logo](https://www.ns2po.ci/wp-content/uploads/2017/10/Logo-NS2PO.png)

Bienvenue dans le monorepo de la nouvelle plateforme digitale de NS2PO. Ce projet vise à moderniser la présence en ligne de l'entreprise via une approche modulaire et progressive.

## Vision Stratégique

Notre objectif est de construire un écosystème digital performant. La première application, **"NS2PO Élections MVP"**, est une plateforme ciblée pour la génération de devis et la pré-commande de gadgets personnalisés à destination des acteurs politiques, afin de maximiser l'impact commercial durant les périodes électorales.

### Fonctionnalités Clés du MVP

- Consultation d'un catalogue de produits électoraux (textiles, gadgets).
- Personnalisation visuelle en temps réel avec téléversement de logos.
- Génération de devis instantanée et dynamique.
- Formulaires de pré-commande et de demande de maquette sur-mesure.

## =€ Stack Technique Principale

![Nuxt.js](https://img.shields.io/badge/Nuxt.js-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-4FF8D4?style=for-the-badge&logo=sqlite&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Airtable](https://img.shields.io/badge/Airtable-18BFFF?style=for-the-badge&logo=airtable&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## <× Structure du Monorepo

Ce projet utilise **pnpm workspaces** et est orchestré par **Turborepo**.

```
ns2po-monorepo/
|
|-- apps/                # Applications déployables
|   |-- election-mvp/    # Notre MVP Nuxt.js pour les élections
|
|-- packages/            # Code partagé et réutilisable
|   |-- ui/              # Bibliothèque de composants Vue (Design System)
|   |-- composables/     # Hooks Vue / Logique réutilisable
|   |-- config/          # Configurations partagées (ESLint, TSConfig)
|   |-- types/           # Interfaces et types TypeScript partagés
|
|-- package.json
|-- pnpm-workspace.yaml
|-- turbo.json
```

## <Á Démarrage Rapide

**Prérequis :**
- Node.js v18+
- pnpm (`npm install -g pnpm`)

1. **Cloner le projet :**
   ```bash
   git clone [URL_DU_REPO]
   cd ns2po-monorepo
   ```

2. **Installer les dépendances :**
   ```bash
   pnpm install
   ```

3. **Configurer les variables d'environnement :**
   Copiez `.env.example` à la racine en `.env` et remplissez les clés d'API (Airtable, Cloudinary, Turso). Ce fichier est géré par Vercel en production.

4. **Lancer l'environnement de développement :**
   Cette commande lance toutes les applications et packages en mode "watch" grâce à Turborepo.
   ```bash
   pnpm dev
   ```

## =à Scripts Utiles

- `pnpm dev`: Lance tous les projets en mode développement.
- `pnpm build`: Construit toutes les applications pour la production.
- `pnpm lint`: Analyse le code de tout le monorepo.
- `pnpm test`: Lance les tests unitaires et d'intégration.

## < Déploiement

Le déploiement est géré automatiquement par **Vercel**.
- Chaque `push` sur une branche de feature crée un **déploiement de prévisualisation**.
- Chaque fusion (`merge`) dans la branche `main` déploie en **production**.

## = Ressources

- **Catalogue Produits :** [Lien vers la base Airtable]
- **Gestion des Médias :** [Lien vers le dashboard Cloudinary]
- **Base de Données :** [Lien vers le dashboard Turso]