# NS2PO - Plateforme Digitale Modulaire

![NS2PO Logo](https://www.ns2po.ci/wp-content/uploads/2017/10/Logo-NS2PO.png)

Bienvenue dans le monorepo de la nouvelle plateforme digitale de NS2PO. Ce projet vise � moderniser la pr�sence en ligne de l'entreprise via une approche modulaire et progressive.

## Vision Strat�gique

Notre objectif est de construire un �cosyst�me digital performant. La premi�re application, **"NS2PO �lections MVP"**, est une plateforme cibl�e pour la g�n�ration de devis et la pr�-commande de gadgets personnalis�s � destination des acteurs politiques, afin de maximiser l'impact commercial durant les p�riodes �lectorales.

### Fonctionnalit�s Cl�s du MVP

- Consultation d'un catalogue de produits �lectoraux (textiles, gadgets).
- Personnalisation visuelle en temps r�el avec t�l�versement de logos.
- G�n�ration de devis instantan�e et dynamique.
- Formulaires de pr�-commande et de demande de maquette sur-mesure.

## =� Stack Technique Principale

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

## <� Structure du Monorepo

Ce projet utilise **pnpm workspaces** et est orchestr� par **Turborepo**.

```
ns2po-monorepo/
|
|-- apps/                # Applications d�ployables
|   |-- election-mvp/    # Notre MVP Nuxt.js pour les �lections
|
|-- packages/            # Code partag� et r�utilisable
|   |-- ui/              # Biblioth�que de composants Vue (Design System)
|   |-- composables/     # Hooks Vue / Logique r�utilisable
|   |-- config/          # Configurations partag�es (ESLint, TSConfig)
|   |-- types/           # Interfaces et types TypeScript partag�s
|
|-- package.json
|-- pnpm-workspace.yaml
|-- turbo.json
```

## <� D�marrage Rapide

**Pr�requis :**
- Node.js v18+
- pnpm (`npm install -g pnpm`)

1. **Cloner le projet :**
   ```bash
   git clone [URL_DU_REPO]
   cd ns2po-monorepo
   ```

2. **Installer les d�pendances :**
   ```bash
   pnpm install
   ```

3. **Configurer les variables d'environnement :**
   Copiez `.env.example` � la racine en `.env` et remplissez les cl�s d'API (Airtable, Cloudinary, Turso). Ce fichier est g�r� par Vercel en production.

4. **Lancer l'environnement de d�veloppement :**
   Cette commande lance toutes les applications et packages en mode "watch" gr�ce � Turborepo.
   ```bash
   pnpm dev
   ```

## =� Scripts Utiles

- `pnpm dev`: Lance tous les projets en mode d�veloppement.
- `pnpm build`: Construit toutes les applications pour la production.
- `pnpm lint`: Analyse le code de tout le monorepo.
- `pnpm test`: Lance les tests unitaires et d'int�gration.

## < D�ploiement

Le d�ploiement est g�r� automatiquement par **Vercel**.
- Chaque `push` sur une branche de feature cr�e un **d�ploiement de pr�visualisation**.
- Chaque fusion (`merge`) dans la branche `main` d�ploie en **production**.

## = Ressources

- **Catalogue Produits :** [Lien vers la base Airtable]
- **Gestion des M�dias :** [Lien vers le dashboard Cloudinary]
- **Base de Donn�es :** [Lien vers le dashboard Turso]