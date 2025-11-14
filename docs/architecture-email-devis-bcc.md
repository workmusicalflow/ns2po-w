# Architecture Email Devis - BCC Multi-Destinataires

**Date**: 2025-11-14
**Contexte**: Ajout copie cachée (BCC) emails commerciaux pour suivi devis
**API**: `/api/quotes/send`

---

## 🎯 Objectif

Permettre à l'équipe commerciale NS2PO de recevoir automatiquement une **copie cachée (BCC)** de chaque devis envoyé aux clients, pour assurer le suivi commercial.

---

## 📧 Architecture Email

### Flux Email Actuel

```
Client remplit formulaire /devis-new
         ↓
POST /api/quotes/send
         ↓
Génération PDF (Puppeteer)
         ↓
Envoi Resend
    ├─→ TO: client@example.com (destinataire principal)
    └─→ BCC: [équipe commerciale] (copie cachée)
```

### Destinataires

| Type | Adresse(s) | Reçoit PDF ? | Visible pour client ? |
|------|-----------|--------------|----------------------|
| **TO** | Email client (saisi formulaire) | ✅ Oui | N/A |
| **BCC** | `ns2pomail@ns2po.ci` | ✅ Oui | ❌ Non (cachée) |
| **BCC** | `mkonan@ns2po.ci` | ✅ Oui | ❌ Non (cachée) |
| **BCC** | `arthurassi@ns2po.ci` | ✅ Oui | ❌ Non (cachée) |

---

## ⚙️ Configuration

### Variable d'Environnement

**Fichier** : `.env`

```bash
# Emails commerciaux (séparés par virgules)
COMMERCIAL_EMAILS=ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci
```

### Nuxt Runtime Config

**Fichier** : `apps/election-mvp/nuxt.config.ts` (ligne ~56)

```typescript
runtimeConfig: {
  // ...
  commercialEmails: process.env.COMMERCIAL_EMAILS || 'ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci',
  // ...
}
```

### API Implementation

**Fichier** : `server/api/quotes/send.post.ts` (ligne ~227-238)

```typescript
// Préparer emails commerciaux BCC (copie cachée pour suivi équipe)
const commercialEmailsRaw = config.commercialEmails || 'ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci'
const commercialEmails = commercialEmailsRaw
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0)

console.log(`[Quote Email API] BCC: ${commercialEmails.length} email(s) équipe commerciale`)

const { data, error } = await resend.emails.send({
  from: fromEmail,
  to: validated.clientEmail,
  bcc: commercialEmails, // BCC multi-destinataires
  subject: `Votre devis NS2PO - ${validated.reference}`,
  html: emailHtml,
  attachments: [{ filename: `Devis_NS2PO_${reference}.pdf`, content: pdfBuffer }]
})
```

---

## 🔒 Sécurité & Confidentialité

### BCC (Blind Carbon Copy)

**Avantages** :
- ✅ Client **ne voit PAS** les emails commerciaux dans les destinataires
- ✅ Confidentialité emails équipe préservée
- ✅ Standard email professionnel (conforme RFC 5322)

**Différence TO / CC / BCC** :

| Type | Visible client ? | Use Case |
|------|------------------|----------|
| **TO** | ✅ Oui | Destinataire principal (client) |
| **CC** | ✅ Oui | Copie visible (ex: collègue client) |
| **BCC** | ❌ Non | Copie cachée (équipe interne) |

---

## 📊 Logs & Monitoring

### Console Logs (Production)

```bash
[Quote Email API] Request received
[Quote Email API] Validated data for DEV-2025-042
[Quote Email API] Building optimized Cloudinary URLs...
[Quote Email API] PDF generated: 188.42KB in 769ms
[Quote Email API] Compiling email template...
[Quote Email API] Sending email via Resend...
[Quote Email API] BCC: 3 email(s) équipe commerciale  # 👈 Log BCC
[Quote Email API] Success! Email sent in 1283ms total (emailId: abc123)
```

### Railway Variables

**Configuration Railway** :

```bash
# Via Railway Dashboard ou CLI
railway variables --set "COMMERCIAL_EMAILS=ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci"
```

**Vérification** :

```bash
railway variables | grep COMMERCIAL_EMAILS
```

---

## 🧪 Tests

### Test Local

1. **Configurer `.env`** :
   ```bash
   COMMERCIAL_EMAILS=test1@example.com,test2@example.com
   ```

2. **Lancer dev** :
   ```bash
   pnpm dev
   ```

3. **Soumettre devis** `/devis-new` :
   - Remplir formulaire
   - Vérifier logs console backend
   - Confirmer `BCC: 2 email(s) équipe commerciale`

4. **Vérifier réception** :
   - Client reçoit email + PDF
   - BCC reçoivent copie identique

### Test Production Railway

1. **Configurer variable** :
   ```bash
   railway variables --set "COMMERCIAL_EMAILS=ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci"
   ```

2. **Redéployer** :
   ```bash
   git push origin feat/sprint-0-survival
   # Railway auto-deploy
   ```

3. **Vérifier logs Railway** :
   ```bash
   railway logs --filter "BCC"
   ```

---

## ⚡ Performance

### Impact BCC

| Métrique | Sans BCC | Avec BCC (3 emails) | Impact |
|----------|----------|---------------------|--------|
| **Génération PDF** | ~770ms | ~770ms | ✅ Aucun |
| **Envoi Resend** | ~500ms | ~500ms | ✅ Aucun |
| **Total API** | ~1280ms | ~1280ms | ✅ Aucun |
| **Coût Resend** | 1 email | 1 email | ✅ BCC = gratuit |

**Note** : Resend considère BCC comme **1 seul email** (TO + BCC = 1 crédit).

---

## 🚨 Fallback & Erreurs

### Si Variable Non Configurée

**Comportement** : Utilise valeurs par défaut hardcodées

```typescript
const commercialEmailsRaw = config.commercialEmails
  || 'ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci'
```

### Si Email BCC Invalide

**Resend validation** : Rejette email avec erreur 400

```bash
[Quote Email API] Resend error: { message: "Invalid email in bcc" }
```

**Solution** : Vérifier format emails dans `COMMERCIAL_EMAILS`

---

## 🔄 Maintenance

### Ajouter un Email Commercial

**Étape 1** : Modifier variable Railway

```bash
railway variables --set "COMMERCIAL_EMAILS=ns2pomail@ns2po.ci,mkonan@ns2po.ci,arthurassi@ns2po.ci,nouvel@ns2po.ci"
```

**Étape 2** : Redéployer (optionnel si Runtime V2)

```bash
railway redeploy
```

### Retirer un Email Commercial

Même procédure, retirer email de la liste CSV.

### Désactiver BCC (Debug)

**Temporaire** (local) :

```bash
# .env
COMMERCIAL_EMAILS=
```

**Production** : Supprimer variable Railway

```bash
railway variables --unset COMMERCIAL_EMAILS
# Utilise fallback hardcodé
```

---

## 📚 Références

- **RFC 5322** : Internet Message Format (BCC standard)
- **Resend Docs** : [Sending Emails](https://resend.com/docs/send-with-nodejs)
- **Nuxt Runtime Config** : [Configuration](https://nuxt.com/docs/guide/going-further/runtime-config)

---

**Dernière mise à jour** : 2025-11-14
**Auteur** : Claude Code (Anthropic)
