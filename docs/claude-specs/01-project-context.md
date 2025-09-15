# Contexte du Projet NS2PO

## Vue d'ensemble

**NS2PO** est une PMI ivoirienne spécialisée dans la publicité et promotion par l'objet depuis 2011. Nous développons un écosystème digital moderne avec comme premier MVP une plateforme ciblée pour les élections.

## Objectif Principal

Créer "NS2PO Élections MVP" - une plateforme de génération de devis et pré-commande de gadgets personnalisés pour les acteurs politiques.

## Repository GitHub

https://github.com/workmusicalflow/ns2po-w.git

## Philosophie de Développement

### 🧠 Mindset Gagnant

1. **"Mobile-first, desktop-enhanced"** : Toujours partir du mobile
2. **"Performance budgets"** : Contraintes = créativité
3. **"Progressive enhancement"** : Amélioration continue > big bang
4. **"User preferences first"** : Respecter reduce-motion, save-data
5. **L'attitude** : Curiosité technique + exigence qualité + pragmatisme

### Anti-patterns à éviter

- **Sous-utilisation des outils MCP** : Exploiter pleinement tous les serveurs MCP disponibles
- **Accumulation de dette technique** : Maintenir la qualité dès le début
- **Over-engineering** : Rester simple et pragmatique
- **Négliger l'optimisation des images** : Utiliser Cloudinary systématiquement
- **L'authentification prématurée** : Pas de système de compte pour le MVP
- **Ignorer les tests E2E** : Tests Playwright obligatoires pour les parcours critiques

## Points d'Attention Spécifiques

### Performance Mobile
- **Taille bundle** < 250KB initial
- **First Contentful Paint** < 2s
- **Images optimisées** pour écrans haute densité

### Accessibilité
- **Contraste** minimum WCAG AA
- **Navigation clavier** complète
- **Screen readers** compatibles
- **Alt text** sur toutes les images

### SEO
- **Meta tags** dynamiques par page
- **Open Graph** pour partage social
- **Structured data** pour produits
- **Sitemap** automatique