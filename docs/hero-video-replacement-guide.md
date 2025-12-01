# Guide de Remplacement - Vidéo Hero Section

**Date** : 2025-11-14
**Contexte** : Remplacement facile de la vidéo d'arrière-plan de la section hero sur la page d'accueil
**Fichier cible** : `apps/election-mvp/pages/index.vue`

---

## 🎯 Vue d'Ensemble

La vidéo hero actuelle (`Multicoloured_Circle_xpo90b.mp4`) est hébergée sur **Cloudinary** et affichée en arrière-plan de la section hero de la page d'accueil.

### Vidéo Actuelle

- **URL** : `https://res.cloudinary.com/dsrvzogof/video/upload/v1756023631/Multicoloured_Circle_xpo90b.mp4`
- **Public ID Cloudinary** : `Multicoloured_Circle_xpo90b`
- **Localisation code** : `apps/election-mvp/pages/index.vue` ligne 14

---

## 📋 Méthode 1 : Upload via Dashboard Cloudinary (Recommandé)

### Étape 1 : Accéder au Dashboard Cloudinary

1. Se connecter à [Cloudinary Dashboard](https://cloudinary.com/console)
2. Credentials NS2PO :
   - **Cloud Name** : `dsrvzogof`
   - **API Key** : `775318993136791`

### Étape 2 : Upload de la Nouvelle Vidéo

1. Dans le dashboard, cliquer sur **"Media Library"**
2. Cliquer sur **"Upload"** (bouton bleu en haut à droite)
3. Sélectionner votre fichier vidéo MP4
4. **Important** : Après l'upload, noter le **Public ID** généré (ex: `hero-video-nouvelle_abc123`)

**Recommandations vidéo** :
- **Format** : MP4 (H.264)
- **Durée** : 10-30 secondes (vidéo loop)
- **Résolution** : 1920x1080 (Full HD) minimum
- **Poids** : < 10 MB (optimisation automatique Cloudinary)
- **Ratio** : 16:9 ou 2.85:1 (adapté au hero actuel)

### Étape 3 : Récupérer l'URL Cloudinary

Après upload, deux options :

**Option A - URL complète** :
```
https://res.cloudinary.com/dsrvzogof/video/upload/v{VERSION}/{PUBLIC_ID}.mp4
```

**Option B - Public ID seul** (Cloudinary génère l'URL) :
```
hero-video-nouvelle_abc123
```

**Exemple URL complète** :
```
https://res.cloudinary.com/dsrvzogof/video/upload/v1756100000/hero-video-nouvelle_abc123.mp4
```

### Étape 4 : Modifier le Code

Ouvrir `apps/election-mvp/pages/index.vue` et remplacer la ligne 14 :

**Avant** :
```vue
<source
  src="https://res.cloudinary.com/dsrvzogof/video/upload/v1756023631/Multicoloured_Circle_xpo90b.mp4"
  type="video/mp4"
>
```

**Après** :
```vue
<source
  src="https://res.cloudinary.com/dsrvzogof/video/upload/v1756100000/hero-video-nouvelle_abc123.mp4"
  type="video/mp4"
>
```

### Étape 5 : Tester Localement

```bash
pnpm dev
```

Ouvrir `http://localhost:3000` et vérifier que la nouvelle vidéo s'affiche correctement.

### Étape 6 : Commit et Déploiement

```bash
git add apps/election-mvp/pages/index.vue
git commit -m "feat(ux): Remplacer vidéo hero section page d'accueil"
git push origin feat/sprint-0-survival
```

Railway déploiera automatiquement le changement.

---

## 📋 Méthode 2 : Upload Programmatique (Avancé)

Si vous préférez uploader via script Node.js :

### Script d'Upload

Créer `scripts/upload-hero-video.js` :

```javascript
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: 'dsrvzogof',
  api_key: '775318993136791',
  api_secret: process.env.CLOUDINARY_API_SECRET // À définir dans .env
})

async function uploadHeroVideo(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      public_id: 'hero-video-custom', // Nom personnalisable
      folder: '', // Optionnel: organiser dans dossier
      overwrite: true,
      invalidate: true, // Invalide cache CDN
      quality: 'auto', // Optimisation auto
      eager: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto', format: 'mp4' }
      ]
    })

    console.log('✅ Upload réussi!')
    console.log('Public ID:', result.public_id)
    console.log('URL:', result.secure_url)
    console.log('Taille:', (result.bytes / 1024 / 1024).toFixed(2), 'MB')

    return result
  } catch (error) {
    console.error('❌ Erreur upload:', error)
    throw error
  }
}

// Utilisation
const videoPath = process.argv[2]
if (!videoPath) {
  console.error('Usage: node scripts/upload-hero-video.js /chemin/vers/video.mp4')
  process.exit(1)
}

uploadHeroVideo(videoPath)
```

### Exécution

```bash
# Définir secret API dans .env
export CLOUDINARY_API_SECRET=ywTgN-mioXQXW1lOWmq2xNAIK7U

# Upload
node scripts/upload-hero-video.js ./nouvelle-video.mp4
```

---

## 🎨 Optimisations Cloudinary Disponibles

### Transformations URL

Cloudinary permet d'optimiser la vidéo directement via l'URL :

**Exemple optimisations** :
```
https://res.cloudinary.com/dsrvzogof/video/upload/
  q_auto,          # Qualité automatique
  w_1920,          # Largeur max 1920px
  c_limit,         # Crop limité (garde ratio)
  f_auto           # Format auto (VP9, H.265...)
/v1756100000/hero-video-custom.mp4
```

**URL optimisée complète** :
```
https://res.cloudinary.com/dsrvzogof/video/upload/q_auto,w_1920,c_limit,f_auto/v1756100000/hero-video-custom.mp4
```

### Format Vue.js avec Transformations

```vue
<source
  src="https://res.cloudinary.com/dsrvzogof/video/upload/q_auto,w_1920,c_limit/v1756100000/hero-video-custom.mp4"
  type="video/mp4"
>
```

---

## 🔍 Troubleshooting

### Vidéo ne s'affiche pas

**Cause** : URL incorrecte ou public_id invalide

**Solution** :
1. Vérifier l'URL dans Cloudinary Media Library
2. Copier l'URL exacte depuis le dashboard
3. Vérifier que le `v{VERSION}` est correct

### Vidéo trop lourde (lent à charger)

**Cause** : Fichier vidéo non optimisé

**Solution** :
1. Ajouter transformations Cloudinary : `q_auto,w_1920,c_limit`
2. Compresser vidéo avant upload (ex: HandBrake, FFmpeg)
3. Réduire durée vidéo (< 20 secondes recommandé)

### Vidéo ne loop pas

**Cause** : Attribut `loop` absent

**Solution** : Vérifier dans `index.vue` ligne 8 :
```vue
<video
  class="hero-video"
  autoplay
  loop          <!-- ✅ Doit être présent -->
  muted
  playsinline
  preload="auto"
>
```

### Cache navigateur (vidéo ancienne persiste)

**Cause** : Cache CDN Cloudinary

**Solution** :
1. Hard refresh navigateur : `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win)
2. Invalider cache Cloudinary dashboard (Settings → Advanced → Invalidate)
3. Changer le `v{VERSION}` dans l'URL (force refresh CDN)

---

## 📊 Checklist de Remplacement

- [ ] Nouvelle vidéo prête (MP4, < 10 MB, 1920x1080)
- [ ] Upload via Cloudinary Dashboard
- [ ] Public ID récupéré
- [ ] URL complète construite
- [ ] Code modifié dans `apps/election-mvp/pages/index.vue` ligne 14
- [ ] Test local (`pnpm dev`)
- [ ] Vidéo s'affiche correctement
- [ ] Vidéo loop sans problème
- [ ] Performance acceptable (< 5s chargement)
- [ ] Commit + push vers Railway
- [ ] Déploiement validé en production

---

## 🎯 Résumé TL;DR

**Pour remplacer la vidéo hero en 3 minutes** :

1. **Upload** nouvelle vidéo sur [Cloudinary Dashboard](https://cloudinary.com/console) (Media Library)
2. **Copier** l'URL générée (ex: `https://res.cloudinary.com/dsrvzogof/video/upload/v.../hero-nouvelle.mp4`)
3. **Remplacer** ligne 14 dans `apps/election-mvp/pages/index.vue`
4. **Commit** et **push** → Railway déploie automatiquement

---

**Dernière mise à jour** : 2025-11-14
**Auteur** : Claude Code (Anthropic)
