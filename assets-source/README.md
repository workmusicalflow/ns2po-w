# 📁 Assets Source - NS2PO Election MVP

Ce dossier contient tous les assets sources téléchargés depuis Freepik, organisés selon une convention de nommage qui facilite l'automatisation.

## 🏷️ Convention de Nommage

**Format général**: `{categorie}-{type}-{numero}.{ext}`

### Exemples par Catégorie

#### Products/Textiles
```
textile-tshirt-001.jpg          → T-shirt basique
textile-polo-002.png            → Polo professionnel  
textile-casquette-003.jpg       → Casquette brodée
textile-sweat-004.png           → Sweatshirt personnalisé
```

#### Products/Gadgets
```
gadget-mug-001.jpg              → Mug céramique
gadget-powerbank-002.png        → Batterie externe
gadget-stylo-003.jpg            → Stylo publicitaire
gadget-cle-usb-004.png          → Clé USB personnalisée
```

#### Products/EPI (Équipements de Protection)
```
epi-gilet-001.jpg               → Gilet de sécurité
epi-casque-002.png              → Casque de chantier
epi-masque-003.jpg              → Masque protection
```

#### Logos
```
logo-client-acme.svg            → Logo client ACME Corp
logo-client-gov-ci.png          → Logo gouvernement CI
logo-ns2po-primary.svg          → Logo NS2PO principal
logo-ns2po-white.png            → Logo NS2PO blanc
```

#### Backgrounds
```
bg-election-patriotic.jpg       → Fond patriotique élections
bg-election-modern.png          → Fond moderne campagne
bg-corporate-clean.jpg          → Fond corporate épuré
bg-corporate-gradient.png       → Fond dégradé professionnel
```

#### Icons
```
icon-ui-cart.svg                → Icône panier
icon-ui-user.svg                → Icône utilisateur
icon-ui-search.svg              → Icône recherche
icon-social-facebook.svg        → Icône Facebook
icon-social-twitter.svg         → Icône Twitter
```

## 🤖 Automatisation

Cette convention permet aux scripts d'automatiquement :

1. **Détecter la catégorie** depuis le préfixe du nom de fichier
2. **Router vers Cloudinary** dans le bon dossier : `ns2po/{category}/{subcategory}/`
3. **Créer les métadonnées Airtable** appropriées
4. **Optimiser les transformations** selon le type (produit, logo, background, etc.)

## 📋 Workflow d'Ajout

1. **Télécharger** l'asset depuis Freepik
2. **Renommer** selon la convention ci-dessus
3. **Placer** dans le dossier approprié
4. **Exécuter** : `pnpm assets:add chemin/vers/fichier`

## 🔄 Scripts Disponibles

```bash
pnpm assets:add ./assets-source/products/textiles/textile-tshirt-001.jpg
pnpm assets:remove textile-tshirt-001
pnpm assets:update textile-tshirt-001 ./nouveau-fichier.jpg
pnpm assets:sync  # Synchronisation complète
```

## 📊 Performance

- **Target** : < 20 secondes de l'asset au déploiement production
- **Optimisations** : Upload parallèle, cache intelligent, invalidation automatique
- **Monitoring** : Logs automatiques de performance par opération