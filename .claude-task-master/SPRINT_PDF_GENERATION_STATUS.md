# 🚀 Sprint PDF Generation - Configuration & Statut

**Projet** : Quote PDF Generation + Email Integration
**Sprint** : Sprint 1 - PDF Generation Core Implementation
**Créé** : 12 Novembre 2025
**Timeline** : 10h30 (3 jours)
**Performance Target** : < 600ms génération, < 2MB taille PDF

---

## 📊 Statut Actuel

### ✅ Configuration Complète

- [x] Projet Task Master créé : `proj-1762984262089-e7e5c9a7`
- [x] Sprint créé : `sprint-1762984276530-52b0f7b2`
- [x] 23 tâches atomiques définies
- [x] TODOs synchronisés (Claude)
- [x] Documentation plan : `PLAN_GENERATION_PDF_DEVIS.md`
- [x] Analyse codebase (Serena)

### 🔴 BLOQUÉ - Action Utilisateur Requise

**Tâche #1 Task Master** : Configuration Resend + Domaine
**Durée estimée** : 2h
**Priorité** : 🔥 CRITIQUE

---

## 🎯 ACTION REQUISE UTILISATEUR

### Étape 1 : Créer Compte Resend (15min)

1. Aller sur : https://resend.com
2. S'inscrire (email + password)
3. Dashboard > Settings > API Keys
4. **Copier RESEND_API_KEY** (format: `re_xxxxxxxxxxxxx`)

### Étape 2 : Vérifier Domaine ns2po.ci (45min)

**Dans Dashboard Resend** :
- Domains > Add Domain
- Domaine : `ns2po.ci`
- Email : `devis@ns2po.ci`

**Configurer DNS chez votre registrar .ci** :

```dns
# SPF
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

# DKIM 1
Type: CNAME
Name: resend._domainkey.ns2po.ci
Value: resend1._domainkey.resend.com

# DKIM 2
Type: CNAME
Name: resend2._domainkey.ns2po.ci
Value: resend2._domainkey.resend.com
```

**Attendre propagation DNS** : 10-30min

### Étape 3 : Test Délivrabilité (1h)

1. Aller sur : https://www.mail-tester.com
2. Copier l'adresse email générée (ex: `test-abc123@mail-tester.com`)
3. Dans Dashboard Resend > Send Test Email :
   - To : adresse mail-tester
   - Subject : "Test NS2PO Devis"
   - Body : Template HTML basique
4. Envoyer
5. Rafraîchir mail-tester.com
6. **Vérifier score ≥ 9/10**

**Si score < 9/10** :
- Vérifier DNS propagés
- Ajuster contenu email
- Retry jusqu'à 3 fois
- Si échec : Fallback SMTP TopDigiTalevel (config existante)

---

## 📋 Checklist Configuration

- [ ] Compte Resend créé
- [ ] RESEND_API_KEY récupérée
- [ ] Domaine ns2po.ci ajouté
- [ ] DNS configurés (SPF + DKIM 1 + DKIM 2)
- [ ] DNS propagés (vérifier avec `dig` ou https://mxtoolbox.com)
- [ ] Email test envoyé via Resend
- [ ] Score mail-tester.com ≥ 9/10

---

## 🔑 Informations à Fournir à Claude

Une fois configuration terminée, fournir :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx  # Votre clé API
RESEND_FROM_EMAIL=devis@ns2po.ci
```

**Confirmation** :
- ✅ Domaine vérifié (badge vert Resend)
- ✅ Score mail-tester.com : **X/10**
- ✅ Prêt pour Phase 2 (développement)

---

## 📦 Analyse Codebase (Serena)

### Structure Existante

```
apps/election-mvp/server/
├── services/
│   └── assetService.ts          ← Pattern service existant
├── api/
│   └── [diverses routes]
├── database/
│   └── migrations/
└── utils/
```

### Services à Créer

```
apps/election-mvp/
├── server/
│   ├── services/
│   │   └── pdf-generator.ts     ← NOUVEAU (Tâche #6)
│   ├── templates/
│   │   └── quote-pdf.html       ← NOUVEAU (Tâche #4)
│   └── api/
│       └── quotes/
│           └── send.post.ts     ← NOUVEAU (Tâche #10)
└── templates/
    └── email/
        └── devis-minimal.mjml   ← NOUVEAU (Phase 2)
```

### Dépendances à Installer

**Étape 1.1** (après configuration Resend) :

```bash
cd apps/election-mvp
pnpm add puppeteer @sparticuz/chromium-min @sidebase/nuxt-pdf handlebars
```

**Packages** :
- `puppeteer` : ~2 MB (PDF generation)
- `@sparticuz/chromium-min` : ~50 MB (Chromium optimisé Railway)
- `@sidebase/nuxt-pdf` : ~500 KB (Module Nuxt)
- `handlebars` : Template engine HTML

---

## 🎯 Prochaines Étapes (Post-Configuration)

### Phase Développement (8h)

**Étape 1** : Installation & Config (1h)
- Installer dépendances PDF
- Configurer `.env` + `nuxt.config.ts`
- Type-check + Serena validation

**Étape 2** : Template HTML (2h)
- Créer `quote-pdf.html` (Handlebars)
- Intégrer branding NS2PO (#C99A3B, #6A2B3A)
- Optimisations Cloudinary (f_auto, q_auto, w_600)

**Étape 3** : Service PDF (3h)
- Créer `pdf-generator.ts` (types TypeScript stricts)
- Implémenter Puppeteer + chromium-min
- Pool browser (réutilisation)
- Helpers (formatQuoteData, optimizeCloudinaryUrl)
- Type-check + Lint

**Étape 4** : API Route (2h)
- Créer `/api/quotes/send.post.ts`
- Intégrer Resend + MJML
- PDF attachment
- Gestion erreurs + retry + fallback
- Type-check + Lint

### Phase Tests (2h)

**Étape 5** : Tests Locaux
- Test PDF standalone (script)
- Test API complète (curl)
- Validation performance (< 600ms)
- Commit Git

### Phase Déploiement (30min)

**Étape 6** : Railway
- Configuration variables (CHROMIUM_EXECUTABLE_PATH)
- Build + Deploy
- Tests production
- Monitoring semaine 1

---

## 📈 Métriques Succès

### Techniques

| Métrique | Target | Mesure |
|----------|--------|--------|
| Génération PDF | < 400ms | Railway logs |
| API response totale | < 600ms | curl timing |
| Taille PDF | < 2 MB | Buffer.length |
| Délivrabilité email | ≥ 95% | Resend dashboard |

### Business

| Métrique | Target | Mesure |
|----------|--------|--------|
| Taux ouverture | ≥ 50% | Resend (J+1) |
| Bounce rate | < 5% | Resend dashboard |
| Spam complaints | 0% | Resend dashboard |

---

## 🔄 Workflow Commits

**Fréquence** : Tous les 2-3 tâches complètes

**Format Conventional Commits** :
```bash
feat(quotes): implement PDF generation service
feat(quotes): add quote-pdf.html template with branding
feat(quotes): create /api/quotes/send with Resend integration
test(quotes): add PDF generation tests
docs(quotes): update implementation plan
```

**Type-check & Lint** : Avant chaque commit

---

## 🚨 Fallback Strategy

### Si Configuration Resend Échoue

**Plan B** : Fallback SMTP TopDigiTalevel (config existante)

Variables déjà configurées :
```env
SMTP_HOST=mail.topdigitalevel.site
SMTP_PORT=587
SMTP_USERNAME=info@topdigitalevel.site
SMTP_PASSWORD=undPzZ3x3U
```

**Adaptation** :
- Email sans PDF (Phase 2 uniquement)
- Ou : PDF en lien Cloudinary temporaire
- Noter dans Task Master : Tâche #1 → Pareto Vault

---

## 📞 Support & Contact

**Questions Configuration Resend** :
- Docs : https://resend.com/docs
- Support : https://resend.com/support
- Discord : https://discord.gg/resend

**Questions Railway** :
- Docs : https://docs.railway.app
- Discord : https://discord.gg/railway

**Questions Technique (Claude)** :
- Analyser logs Task Master
- Utiliser Serena pour navigation code
- Type-check + Lint réguliers

---

## ✅ Validation Finale

Une fois configuration Resend terminée :

```
✅ RESEND_API_KEY récupérée
✅ Domaine ns2po.ci vérifié
✅ Score mail-tester.com ≥ 9/10
✅ Prêt à débloquer Tâche #2 (Installation dépendances)
```

**→ Fournir ces informations à Claude pour continuer**

---

**Statut** : 🔴 BLOQUÉ (Action Utilisateur)
**Prochaine action** : Configuration Resend
**ETA Sprint** : 3 jours (post-déblocage)
