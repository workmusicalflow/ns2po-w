# 🚀 Plan d'Action MVP : Email Quote Delivery

**Version MVP - Novembre 2025**
**Stack : MJML + Resend API**
**Timeline : 24h (5h dev + 19h test/stabilisation)**

---

## 🎯 Mission Critique

> **Permettre aux clients NS2PO de recevoir leur devis par email de manière fiable (délivrabilité ≥ 9/10) avec un bouton pour consulter le détail.**

**Objectif** : Valider que l'envoi fonctionne et que les clients ouvrent leurs devis.

---

## 📋 Plan d'Action MVP (5h dev)

### Phase 1 : Test Délivrabilité Resend (2h)

**Tâches critiques** :

1. **Créer compte Resend** (15min)
   - Aller sur [resend.com](https://resend.com)
   - S'inscrire (email + password)
   - Récupérer API key dans Settings

2. **Vérifier domaine ns2po.ci** (45min)
   ```bash
   # Dans dashboard Resend > Domains > Add Domain
   # Domaine : ns2po.ci
   # Email : devis@ns2po.ci

   # DNS Records à ajouter (chez registrar .ci) :
   # SPF : TXT @ "v=spf1 include:resend.com ~all"
   # DKIM 1 : CNAME resend._domainkey.ns2po.ci → resend1._domainkey.resend.com
   # DKIM 2 : CNAME resend2._domainkey.ns2po.ci → resend2._domainkey.resend.com

   # Attendre propagation DNS : 10-30min
   ```

3. **Test mail-tester.com** (1h)
   ```bash
   # Envoyer 1 email test via dashboard Resend
   # To : test-xxxxx@mail-tester.com (générer sur site)
   # Subject : "Test NS2PO Devis"
   # Body : Template basique HTML

   # Vérifier score sur mail-tester.com
   # Target : ≥ 9/10

   # Si < 9/10 : Vérifier DNS, ajuster contenu, retry
   ```

**Critères Go/No-Go** :
- ✅ **GO** : Score ≥ 9/10 → Continuer Phase 2
- ❌ **NO-GO** : Score < 9/10 après 3 tentatives → **Fallback SMTP** (config existante TopDigiTalevel)

---

### Phase 2 : Développement Template + API (3h)

**Structure finale** :
```
apps/election-mvp/
├── server/api/email/
│   └── send-devis.ts              # API Route Resend
├── templates/email/
│   └── devis-minimal.mjml         # Template MVP
├── package.json                    # + mjml, resend
└── .env                           # RESEND_API_KEY
```

#### Étape 1 : Installation (15min)

```bash
cd apps/election-mvp

# Installation dépendances
pnpm add mjml resend zod

# Variables env (.env)
echo "RESEND_API_KEY=re_xxxxxxxxxxxxx" >> .env
echo "RESEND_FROM_EMAIL=devis@ns2po.ci" >> .env
```

#### Étape 2 : Template MJML Minimal (45min)

**Fichier** : `apps/election-mvp/templates/email/devis-minimal.mjml`

```mjml
<mjml>
  <mj-body background-color="#f4f4f4">
    <!-- Header Logo -->
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-image
          src="https://res.cloudinary.com/dsrvzogof/image/upload/c_scale,w_150,f_auto/logo-ns2po.png"
          width="150px"
          alt="NS2PO"
        />
      </mj-column>
    </mj-section>

    <!-- Contenu -->
    <mj-section background-color="#ffffff" padding="30px">
      <mj-column>
        <mj-text font-size="20px" color="#333333" font-weight="bold">
          Bonjour {{clientName}},
        </mj-text>

        <mj-text font-size="16px" color="#666666" line-height="1.6">
          Votre devis de campagne électorale est prêt.
        </mj-text>

        <mj-text font-size="24px" color="#C99A3B" font-weight="bold" align="center">
          {{totalAmount}} FCFA
        </mj-text>

        <mj-button
          background-color="#C99A3B"
          href="{{ctaUrl}}"
          font-size="18px"
          padding="15px 40px"
        >
          Voir mon devis
        </mj-button>

        <mj-text font-size="14px" color="#999999" align="center">
          Référence : {{reference}}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section background-color="#f4f4f4" padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#999999" align="center">
          NS2PO - Publicité par l'Objet depuis 2011<br/>
          Abidjan, Côte d'Ivoire<br/>
          <a href="mailto:devis@ns2po.ci" style="color:#C99A3B">devis@ns2po.ci</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

**Résultat** : ~12KB compilé, responsive auto, compatible Gmail/Outlook

#### Étape 3 : API Route (2h)

**Fichier** : `apps/election-mvp/server/api/email/send-devis.ts`

```typescript
import { Resend } from 'resend'
import { mjml2html } from 'mjml'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

// Validation Zod
const DevisEmailSchema = z.object({
  to: z.string().email(),
  clientName: z.string(),
  reference: z.string(),
  totalAmount: z.string(),
  ctaUrl: z.string().url(),
})

export default defineEventHandler(async (event) => {
  try {
    // Validation body
    const body = await readBody(event)
    const validated = DevisEmailSchema.parse(body)

    // Lire template MJML
    const templatePath = resolve(process.cwd(), 'templates/email/devis-minimal.mjml')
    let mjmlContent = readFileSync(templatePath, 'utf-8')

    // Remplacer variables
    mjmlContent = mjmlContent
      .replace(/{{clientName}}/g, validated.clientName)
      .replace(/{{totalAmount}}/g, validated.totalAmount)
      .replace(/{{ctaUrl}}/g, validated.ctaUrl)
      .replace(/{{reference}}/g, validated.reference)

    // Compiler MJML → HTML
    const { html, errors } = mjml2html(mjmlContent, {
      minify: true,
      keepComments: false,
    })

    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'MJML compilation error',
        data: errors,
      })
    }

    // Envoyer via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'devis@ns2po.ci',
      to: validated.to,
      subject: `Votre devis NS2PO - ${validated.reference}`,
      html,
    })

    if (error) {
      // Fallback SMTP si Resend échoue
      console.error('[Resend Error]', error)
      throw createError({
        statusCode: 500,
        message: 'Email sending failed via Resend',
        data: error,
      })
    }

    return {
      success: true,
      emailId: data?.id,
      message: 'Email envoyé avec succès',
    }
  } catch (err: any) {
    console.error('[Email API Error]', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal server error',
    })
  }
})
```

**Sécurité** :
- ✅ Validation Zod stricte
- ✅ Error handling complet
- ✅ Logs pour debugging
- ✅ Fallback SMTP (à implémenter si Resend fail)

---

### Phase 3 : Test Manuel Production (30min)

**Checklist** :

```bash
# 1. Build local
cd apps/election-mvp
pnpm build

# 2. Test API locale
curl -X POST http://localhost:3000/api/email/send-devis \
  -H "Content-Type: application/json" \
  -d '{
    "to": "votre-email@test.com",
    "clientName": "Jean Dupont",
    "reference": "DEV-TEST-001",
    "totalAmount": "1 250 000",
    "ctaUrl": "https://ns2po.ci/devis/DEV-TEST-001"
  }'

# 3. Vérifier réception email
# - Email reçu ? ✅
# - Affichage correct Gmail mobile ? ✅
# - Affichage correct Outlook desktop ? ✅
# - CTA cliquable ? ✅
# - Score mail-tester.com ≥ 9/10 ? ✅

# 4. Déployer Railway
railway up --detach

# 5. Test production
# Même curl mais avec URL Railway
```

**Métriques à vérifier** (Dashboard Resend) :
- Delivered : 100%
- Opened : À mesurer après 24h
- Bounced : 0%

---

## 📊 Plan B : Fallback SMTP

**Si Resend échoue** (score < 9/10 OU erreurs API) :

### Configuration SMTP existante (TopDigiTalevel)

```typescript
// server/api/email/send-devis.ts (ajout fallback)

import nodemailer from 'nodemailer'

// Après le bloc Resend, ajouter :
if (error) {
  console.warn('[Fallback] Using SMTP TopDigiTalevel')

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_USERNAME,
    to: validated.to,
    subject: `Votre devis NS2PO - ${validated.reference}`,
    html,
  })

  return {
    success: true,
    provider: 'smtp-fallback',
    message: 'Email envoyé via SMTP',
  }
}
```

**Variables env SMTP** (déjà configurées) :
```bash
SMTP_HOST=mail.topdigitalevel.site
SMTP_PORT=587
SMTP_USERNAME=info@topdigitalevel.site
SMTP_PASSWORD=undPzZ3x3U
```

**Installation** :
```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

---

## 🎯 Métriques MVP (Semaine 1)

**Dashboard Resend** (gratuit, 0 code) :

| Métrique | Target | Fréquence |
|:---------|:-------|:----------|
| Taux délivrabilité | ≥ 95% | Quotidien |
| Taux ouverture | ≥ 50% | Hebdo |
| Taux clic CTA | ≥ 20% | Hebdo |
| Taux bounce | < 5% | Quotidien |

**Pas de webhooks, pas d'analytics custom, pas de NPS** → Dashboard Resend suffit pour MVP

---

## ⏱️ Timeline 24h

```
Heure 0-2  : Phase 1 - Test délivrabilité Resend
Heure 2-5  : Phase 2 - Développement (template + API)
Heure 5-6  : Phase 3 - Tests manuels local + prod
Heure 6-24 : Stabilisation, monitoring première vague emails
```

**Livrable H+6** :
- ✅ Email devis envoyé via Resend
- ✅ Score mail-tester.com ≥ 9/10
- ✅ Template responsive Gmail/Outlook
- ✅ CTA fonctionnel
- ✅ Fallback SMTP opérationnel

---

## 🚫 Hors Scope MVP

**Reporté à V2** (si besoin validé après 2-4 semaines) :

- ❌ Webhooks Resend + table `email_events`
- ❌ Handler `/api/webhooks/resend`
- ❌ Feedback NPS embarqué
- ❌ Dark mode email
- ❌ Tests cross-client Email on Acid
- ❌ Tests E2E Playwright
- ❌ Template MJML riche (gradient, badges)
- ❌ Plain-text version optimisée
- ❌ Monitoring auto `/api/admin/email-health`
- ❌ CDN local Bunny
- ❌ Migration Drizzle table contacts
- ❌ AWS SES (SMTP suffit comme Plan B)

**Principe** : Ne construire QUE ce qui permet de valider l'hypothèse en 24h.

---

## ✅ Critères de Succès MVP

**Après 24h** :

1. ✅ 10 emails test envoyés avec succès (delivered)
2. ✅ Score mail-tester.com ≥ 9/10 maintenu
3. ✅ Taux ouverture ≥ 50% (mesure Dashboard Resend J+1)
4. ✅ 0 bounce, 0 complaint
5. ✅ Feedback positif 3/5 clients contactés manuellement

**Si succès** → Maintenir MVP tel quel 2-4 semaines, mesurer volumétrie
**Si échec** → Fallback SMTP immédiat OU itérer template/message

---

## 📚 Ressources Essentielles

**Documentation** :
- [Resend Quickstart](https://resend.com/docs/send-with-nodejs)
- [MJML Documentation](https://mjml.io/documentation/)
- [mail-tester.com](https://www.mail-tester.com/)

**Support** :
- Resend : [support@resend.com](mailto:support@resend.com)
- MJML : [GitHub Issues](https://github.com/mjmlio/mjml/issues)

---

**Version MVP - Novembre 2025** | **Timeline : 24h** | **Stack : MJML + Resend (fallback SMTP)**
