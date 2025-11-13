# 🚀 Guide de Validation Production - API Quotes + PDF

**Date**: 2025-11-13
**Déploiement**: ✅ Railway CI/CD effectif (commits e5549a0)
**Statut Sprint**: 93% (25/27 tâches) → **Tests production en cours**

---

## 📋 Prérequis Validés

✅ **Déploiement Railway**: 4 commits déployés via CI/CD
✅ **Variables configurées**: Resend API key, email from, Chromium paths
✅ **Domaine Resend vérifié**: `reachup.site` (DNS records OK)
✅ **Build production réussi**: 51.8 MB (16 MB gzip)
✅ **Tests locaux validés**: PDF 310 KB, API 7s cold start

---

## 🎯 Objectif Tests Production

**Task #26**: Valider endpoint production `/api/quotes/send`

### Critères de Succès
1. **HTTP 200**: API répond avec succès
2. **Performance < 1s**: Après warm-up Chromium (première requête ~5-7s attendue)
3. **PDF généré**: Taille 300-500 KB, contenu valide
4. **Email envoyé**: Resend retourne emailId
5. **Email reçu**: Inbox test contient email + PDF attaché

---

## 🛠️ Option 1: Script de Test Automatique (Recommandé)

### Étape 1: Vérifier URL Production

```bash
# Obtenir l'URL de production Railway
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp
railway status
# Ou: railway open (ouvre dashboard web)
```

**URL actuelle**: `https://nuxt-app-production-8b86.up.railway.app`

### Étape 2: Exécuter le Script de Test

```bash
# Si URL par défaut (Railway standard)
./scripts/test-production-quote-api.sh

# Si URL personnalisée
PRODUCTION_URL="https://votre-url.railway.app" ./scripts/test-production-quote-api.sh
```

### Étape 3: Interpréter les Résultats

**✅ Succès attendu**:
```
🎉 TEST RÉUSSI - API Production Opérationnelle

📊 Résultats HTTP
Status Code:        200
Temps total:        0.845s (845ms mesuré)

🎯 Validation Critères de Succès
✅ HTTP 200 OK
✅ Performance < 1s (845ms)
✅ Champ 'success: true' présent
✅ Email envoyé (ID: re_abc123xyz)
✅ PDF généré (302 KB)
```

**⚠️ Premier appel lent (normal)**:
Si temps > 5s au premier appel → Cold start Chromium (attendu)
→ Relancer le script, devrait être < 1s au 2e appel

**❌ Erreurs possibles**:
- HTTP 500 + "Resend domain not verified" → Vérifier domaine `reachup.site` sur https://resend.com/domains
- HTTP 500 + "PDF generation failed" → Vérifier logs Railway (`railway logs --follow`)
- Timeout > 10s → Vérifier variables Chromium (`CHROMIUM_EXECUTABLE_PATH`, `PUPPETEER_CACHE_DIR`)

---

## 🛠️ Option 2: Test Manuel Curl

### Curl Simple

```bash
curl -X POST https://nuxt-app-production-8b86.up.railway.app/api/quotes/send \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Utilisateur",
    "clientEmail": "votre-email@example.com",
    "clientPhone": "+225 07 12 34 56 78",
    "reference": "TEST-PROD-'$(date +%s)'",
    "items": [{
      "name": "T-Shirt personnalisé",
      "imageUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/tshirt-001.jpg",
      "customization": "Logo NS2PO",
      "quantity": 50,
      "unitPrice": 3500,
      "totalPrice": 175000
    }],
    "subtotal": 175000,
    "discount": 0,
    "tax": 31500,
    "total": 206500,
    "logoUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/w_200,c_fit,q_auto,f_auto/v1759082596/logo-ns2po-mailing_vzelsq.png"
  }' | jq '.'
```

**⚠️ Important**: Remplacer `votre-email@example.com` par votre vraie adresse email pour recevoir le devis.

### Réponse Attendue

```json
{
  "success": true,
  "emailId": "re_abc123xyz",
  "reference": "TEST-PROD-1763012345",
  "pdfSize": 308742,
  "pdfGenerationTime": 387,
  "totalTime": 542,
  "message": "Email envoyé avec succès"
}
```

---

## 📧 Validation Email Reçu

### Étape 1: Vérifier Inbox

1. **Ouvrir inbox** de l'email test (`votre-email@example.com`)
2. **Rechercher email** de `noreply@reachup.site`
3. **Sujet attendu**: "Votre devis NS2PO - TEST-PROD-XXXXXX"

### Étape 2: Vérifier Contenu Email

✅ **Template MJML compilé**: Email responsive avec design NS2PO
✅ **Nom client présent**: "Bonjour Test Utilisateur"
✅ **Montant total affiché**: "206 500 FCFA" (formaté français)
✅ **CTA button**: "Voir mon devis" (lien vers détail)
✅ **Footer NS2PO**: Coordonnées + branding

### Étape 3: Vérifier PDF Attaché

1. **Télécharger PDF** (`Devis_NS2PO_TEST-PROD-XXXXXX.pdf`)
2. **Ouvrir PDF** (devrait s'ouvrir sans erreur)
3. **Valider contenu**:
   - ✅ Logo NS2PO en header
   - ✅ Informations client (nom, email, téléphone)
   - ✅ ❌ **Pas de champ "Organisation"** (refactor effectué)
   - ✅ Tableau produits (T-Shirt, quantité, prix)
   - ✅ Sous-total, TVA 18%, Total
   - ✅ Images Cloudinary optimisées
   - ✅ Footer avec coordonnées NS2PO

**Taille attendue**: 300-500 KB

---

## 🔍 Monitoring Post-Test

### Railway Analytics

```bash
# Logs temps réel
railway logs --follow

# Logs récents (100 dernières lignes)
railway logs -n 100
```

**Événements attendus**:
```
[Quote Email API] Request received
[Quote Email API] Validated data for TEST-PROD-XXXXXX
[Quote Email API] Generating PDF...
[PDF Generator] Starting PDF generation for TEST-PROD-XXXXXX
[PDF Generator] PDF generated successfully: 302.45KB in 387ms
[Quote Email API] PDF generated: 302.45KB in 387ms
[Quote Email API] Compiling email template...
[Quote Email API] Sending email via Resend...
[Quote Email API] Success! Email sent in 542ms total (emailId: re_abc123xyz)
```

**⚠️ Warnings attendus (non bloquants)**:
- `Performance warning: 5842ms > 600ms target` (premier appel - cold start Chromium)
- `MJML "minify" option is deprecated` (warning MJML lib, pas impact fonctionnel)

### Resend Dashboard

1. **Ouvrir**: https://resend.com/emails
2. **Vérifier email envoyé**: Status "Delivered" ✅
3. **Métriques**:
   - Delivery time < 2s
   - Bounce rate: 0%
   - Open rate: À surveiller

---

## 🐛 Troubleshooting

### Erreur: "Domain not verified"

**Symptôme**: HTTP 500 + `"The reachup.site domain is not verified"`

**Solution**:
1. Aller sur https://resend.com/domains
2. Vérifier statut domaine `reachup.site`
3. Si DNS records manquants, ajouter:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Records fournis par Resend
   - DMARC: `v=DMARC1; p=none`

### Erreur: "PDF generation failed"

**Symptôme**: HTTP 500 + `"PDF generation failed: ..."`

**Vérifier variables Railway**:
```bash
railway variables | grep -E "(CHROMIUM|PUPPETEER)"
```

**Variables attendues**:
```
CHROMIUM_EXECUTABLE_PATH=/tmp/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer
```

**Si manquantes**:
```bash
railway variables --set "CHROMIUM_EXECUTABLE_PATH=/tmp/chromium"
railway variables --set "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true"
railway variables --set "PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer"
```

### Performance Lente (> 5s)

**Premier appel**: Normal (cold start Chromium ~5-7s)
**Appels suivants**: Devrait être < 1s

**Si toujours lent**:
1. Vérifier logs Railway (`railway logs`)
2. Vérifier Runtime V2 activé: `railway variables | grep RAILWAY_BETA_ENABLE_BUILD_V2`
   - Si absent: `railway variables --set "RAILWAY_BETA_ENABLE_BUILD_V2=1"` puis redeploy

---

## ✅ Checklist Validation Complète

### Tests Techniques
- [ ] Script `test-production-quote-api.sh` exécuté avec succès
- [ ] HTTP 200 retourné
- [ ] Performance < 1s (après warm-up)
- [ ] JSON response valide avec `success: true`
- [ ] `emailId` Resend présent
- [ ] `pdfSize` entre 300-500 KB

### Tests Fonctionnels
- [ ] Email reçu dans inbox test
- [ ] Template MJML correctement affiché
- [ ] PDF attaché téléchargeable
- [ ] PDF contient données client correctes
- [ ] PDF ne contient **pas** le champ "Organisation" (refactor validé)
- [ ] Images Cloudinary chargées dans PDF

### Monitoring
- [ ] Railway logs montrent génération réussie
- [ ] Resend dashboard montre email "Delivered"
- [ ] Aucune erreur critique dans logs

---

## 📊 Métriques Cibles Post-Validation

**Performance API**:
- Cold start: < 7s (acceptable)
- Warm run: < 600ms (objectif)

**Taille PDF**:
- Target: < 500 KB
- Observé local: 310 KB ✅

**Email Delivery**:
- Resend delivery time: < 2s
- Inbox reception: < 5s
- Bounce rate: 0%

---

## 🎯 Next Steps Après Validation

### Si Tests Réussis ✅
1. **Marquer Task #26 complétée**
2. **Démarrer Task #27**: Monitoring semaine 1
   - Railway Analytics (erreurs, performance)
   - Resend Dashboard (delivery rate, bounces)
   - Rapport hebdomadaire

### Si Tests Échoués ❌
1. **Analyser logs Railway** (`railway logs -n 200`)
2. **Vérifier variables env** (`railway variables`)
3. **Tester endpoint health** (`curl https://URL/api/health`)
4. **Contacter support Railway** si persistant

---

**Scripts disponibles**:
- `/apps/election-mvp/scripts/test-production-quote-api.sh` (test automatique)
- `/apps/election-mvp/scripts/test-pdf-generation.ts` (test PDF local)
- `/apps/election-mvp/scripts/test-api-send-quote.sh` (test API local)

**Rapports disponibles**:
- `.claude-task-master/SPRINT_PDF_FINAL_STATUS.md` (statut sprint)
- `.claude-task-master/ORGANIZATION_FIELD_REMOVAL_REPORT.md` (refactor organisation)
- `.claude-task-master/SPRINT_PDF_TEST_RESULTS.md` (tests locaux)
- `.claude-task-master/PRODUCTION_VALIDATION_GUIDE.md` (ce guide)
