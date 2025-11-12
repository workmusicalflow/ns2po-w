# 📄 Plan d'Implémentation : Génération Devis PDF + Email

**Version** : 1.0
**Date** : 12 Novembre 2025
**Auteur** : NS2PO-Architect (Claude Code + Gemini Copilot + Perplexity Copilot)
**Contexte** : MVP NS2PO Election - Complément Phase 2 Email Delivery

---

## 🎯 Objectif

Intégrer la génération dynamique de devis PDF (incluant images Cloudinary) au système email existant (MJML + Resend Phase 2), avec envoi en pièce jointe.

---

## 📊 Analyse Comparative Solutions PDF (Recherche 2025)

### Méthodologie Recherche

**Sources consultées :**
- ✅ Gemini Copilot avec Google Search Grounding (8 recherches web, 23 sources citées)
- ✅ Perplexity Copilot Sonar Pro (recherche approfondie Railway + Resend)
- ✅ Benchmarks communauté 2024-2025 (Reddit, Medium, GitHub)

### Comparatif Solutions PDF Node.js

| Solution | Bundle Size | Cold Start | Performance | Fidélité CSS | Complexité | Railway Compat |
|----------|-------------|------------|-------------|--------------|------------|----------------|
| **Puppeteer** | ~50 MB | 250-400ms | ⭐⭐⭐⭐⭐ | Pixel-perfect | Moyenne | ✅ Excellente |
| **Playwright** | ~150 MB | 400-550ms | ⭐⭐⭐⭐ | Pixel-perfect | Moyenne | ✅ Bonne |
| **PDFKit** | ~5 MB | 50-100ms | ⭐⭐⭐⭐⭐ | Limitée | Élevée | ✅ Excellente |
| **react-pdf** | ~8 MB | 100-200ms | ⭐⭐⭐⭐ | Bonne | Moyenne | ✅ Bonne |
| **Gotenberg** | N/A (SaaS) | 700-2000ms | ⭐⭐⭐ | Excellente | Faible | ⚠️ Latency 3G |
| **PDFShift** | N/A (SaaS) | 1500-3000ms | ⭐⭐ | Excellente | Faible | ⚠️ Latency 3G |

### ✅ Recommandation : Puppeteer + @sparticuz/chromium-min

**Justification technique :**

1. **Performance optimale Railway Runtime V2**
   - Bundle léger : ~50 MB vs 150+ MB (Playwright multi-browser)
   - Cold start : 250-400ms (compatible target < 500ms)
   - Consommation RAM : 150-250 MB (acceptable Railway)

2. **Fidélité rendu HTML/CSS**
   - Chromium natif : Pixel-perfect pour devis complexes
   - Support complet Tailwind CSS, Flexbox, Grid
   - Images Cloudinary : Chargement URLs direct

3. **Écosystème mature 2025**
   - Module Nuxt : `@sidebase/nuxt-pdf` (maintenance active)
   - Chromium optimisé : `@sparticuz/chromium-min` (Railway compatible)
   - Communauté : 45K+ stars GitHub, docs exhaustives

4. **Benchmarks réels (source Perplexity 2025)**
   - Génération PDF 5-10 produits + 3-5 images : **400-600ms total**
   - Rendu HTML → PDF pur : **120-220ms**
   - Compatible mobile 3G Côte d'Ivoire : < 1s perçu

**Alternatives écartées :**

- **PDFKit** : Effort manuel élevé (définition programmatique), pas de support CSS avancé
- **react-pdf** : Courbe apprentissage (API propriétaire), performances similaires
- **Playwright** : Bundle 3x plus lourd, multi-browser inutile pour notre use case
- **Services externes** (Gotenberg, PDFShift) : +1-2s latency 3G, coûts additionnels, dépendance externe

---

## 🏗️ Architecture Flux : Panier → PDF → Email

### Séquence Technique Détaillée

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. Validation Panier                         │
│  Client soumet formulaire coordonnées + validation items        │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│         2. API Route: /server/api/quotes/send.post.ts           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2.1. Validation Zod (email, quoteId, clientData)        │   │
│  │ 2.2. Fetch quote data depuis Turso (produits, prix)     │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│       3. Service PDF: server/services/pdf-generator.ts          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3.1. Générer HTML depuis template Vue/HTML              │   │
│  │      - Injecter données devis (produits, totaux)        │   │
│  │      - URLs images Cloudinary optimisées                │   │
│  │      - CSS inline (Tailwind + branding NS2PO)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3.2. Launch Puppeteer (chromium-min)                    │   │
│  │      - Instancier browser (pool ou new)                 │   │
│  │      - page.setContent(htmlString)                       │   │
│  │      - page.pdf({ format: 'A4', buffer: true })         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3.3. Return PDF Buffer (RAM uniquement)                 │   │
│  │      - Taille typique: 500 KB - 2 MB                     │   │
│  │      - Pas de stockage filesystem /tmp                   │   │
│  │      - Close browser page                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│         4. Email Service: Resend API Integration                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4.1. Compiler template MJML email (Phase 2 existant)    │   │
│  │      - Réutiliser devis-minimal.mjml                     │   │
│  │      - Variables: clientName, reference, totalAmount     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4.2. Resend.emails.send()                                │   │
│  │      - from: devis@ns2po.ci                              │   │
│  │      - to: client.email                                  │   │
│  │      - subject: "Votre devis NS2PO - {ref}"              │   │
│  │      - html: mjmlCompiled                                │   │
│  │      - attachments: [{ filename, content: pdfBuffer }]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4.3. Libérer Buffer + Error Handling                     │   │
│  │      - pdfBuffer = null (GC)                             │   │
│  │      - Retry Resend (1x) si erreur réseau               │   │
│  │      - Fallback: Email sans PDF + log admin             │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│           5. Confirmation Client (Email + PDF joint)            │
│  - Email délivré (Dashboard Resend: delivered)                 │
│  - PDF téléchargeable depuis attachment Gmail/Outlook          │
│  - Tracking ouverture email (Resend analytics)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Choix Techniques Clés

| Décision | Justification | Alternative Écartée |
|----------|---------------|---------------------|
| **Synchrone** | Temps total < 1s acceptable UX, simplicité MVP | Asynchrone (queue) : over-engineering |
| **Buffer RAM uniquement** | Railway filesystem éphémère, pas besoin persistance | Stockage /tmp ou S3 : complexité inutile |
| **PDF attachment direct** | Resend API supporte 20 MB, user friendly | Lien téléchargement : nécessite storage |
| **Images Cloudinary URLs** | Optimisation auto (webp, 600px), CDN rapide | Base64 embed : taille PDF x3 |
| **Pool Puppeteer optionnel** | Réutilisation browser si volume élevé | New browser/request : +100ms cold start |

### Gestion Erreurs & Résilience

```typescript
try {
  // 1. Génération PDF
  const pdfBuffer = await generateQuotePDF(quoteData)

  // 2. Envoi email
  const result = await resend.emails.send({...})

  if (result.error) {
    // Retry 1x
    await sleep(1000)
    const retryResult = await resend.emails.send({...})

    if (retryResult.error) {
      // Fallback: Email sans PDF
      await sendEmailWithoutPDF(quoteData)
      await notifyAdmin('PDF failed', quoteData)
    }
  }

} catch (error) {
  // Log Railway
  console.error('[Quote PDF Error]', error)

  // Fallback SMTP (Phase 2)
  await sendViaSMTP(quoteData)

  throw createError({
    statusCode: 500,
    message: 'Erreur génération devis'
  })
}
```

---

## 📦 Décomposition Implémentation (6 Étapes)

### Étape 1 : Installation Dépendances (30min)

**Commandes :**

```bash
cd apps/election-mvp

# Packages génération PDF
pnpm add puppeteer @sparticuz/chromium-min

# Module Nuxt (optionnel, facilite intégration)
pnpm add @sidebase/nuxt-pdf

# Packages déjà installés Phase 2 (vérification)
# pnpm list resend mjml zod
```

**Tailles packages :**
- `puppeteer` : ~2 MB (npm)
- `@sparticuz/chromium-min` : ~50 MB (binaire Chromium)
- `@sidebase/nuxt-pdf` : ~500 KB

**Variables environnement (.env) :**

```bash
# ============================================
# RESEND EMAIL (Phase 2 - Déjà existantes)
# ============================================
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=devis@ns2po.ci

# ============================================
# PUPPETEER PDF GENERATION (Nouvelles)
# ============================================
# Railway Runtime V2 : Chromium binary path
CHROMIUM_EXECUTABLE_PATH=/tmp/chromium

# Performance tuning (optionnel)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer
```

**Configuration Nuxt (`nuxt.config.ts`) :**

```typescript
export default defineNuxtConfig({
  modules: [
    // ... modules existants
    '@sidebase/nuxt-pdf', // Nouveau
  ],

  // Configuration Puppeteer
  runtimeConfig: {
    chromiumPath: process.env.CHROMIUM_EXECUTABLE_PATH || '',
    pdf: {
      quality: 90,
      format: 'A4',
      printBackground: true,
    }
  },
})
```

---

### Étape 2 : Template HTML Devis (2h)

**Fichier** : `apps/election-mvp/server/templates/quote-pdf.html`

**Structure complète :**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis NS2PO - {{reference}}</title>
  <style>
    /* CSS Inline - Performance critique */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #2D2D2D;
      background: #FFFFFF;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #C99A3B;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .logo img {
      height: 60px;
    }

    .reference {
      text-align: right;
    }

    .reference h1 {
      font-size: 24px;
      color: #6A2B3A;
      margin-bottom: 5px;
    }

    .reference p {
      font-size: 12px;
      color: #666;
    }

    /* Client Info */
    .client-info {
      background: #F8F8F8;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .client-info h2 {
      font-size: 16px;
      color: #6A2B3A;
      margin-bottom: 10px;
    }

    .client-info p {
      margin-bottom: 5px;
    }

    /* Products Table */
    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .products-table thead {
      background: #C99A3B;
      color: white;
    }

    .products-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }

    .products-table td {
      padding: 12px;
      border-bottom: 1px solid #E0E0E0;
    }

    .products-table tbody tr:hover {
      background: #FAFAFA;
    }

    .product-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .product-name {
      font-weight: 600;
      color: #2D2D2D;
    }

    .text-right {
      text-align: right;
    }

    /* Totals */
    .totals {
      max-width: 400px;
      margin-left: auto;
      margin-bottom: 30px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #E0E0E0;
    }

    .totals-row.total {
      border-top: 2px solid #C99A3B;
      border-bottom: 2px solid #C99A3B;
      font-weight: 700;
      font-size: 18px;
      color: #6A2B3A;
      margin-top: 10px;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #E0E0E0;
      color: #666;
      font-size: 12px;
    }

    .footer p {
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <img src="{{logoUrl}}" alt="NS2PO Logo">
      </div>
      <div class="reference">
        <h1>DEVIS N° {{reference}}</h1>
        <p>Date : {{date}}</p>
        <p>Validité : 30 jours</p>
      </div>
    </div>

    <!-- Client Info -->
    <div class="client-info">
      <h2>Informations Client</h2>
      <p><strong>Nom :</strong> {{clientName}}</p>
      <p><strong>Email :</strong> {{clientEmail}}</p>
      <p><strong>Téléphone :</strong> {{clientPhone}}</p>
      {{#if clientOrganization}}
      <p><strong>Organisation :</strong> {{clientOrganization}}</p>
      {{/if}}
    </div>

    <!-- Products Table -->
    <table class="products-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Produit</th>
          <th class="text-right">Quantité</th>
          <th class="text-right">Prix Unitaire</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>
            <img src="{{imageUrl}}" alt="{{name}}" class="product-image">
          </td>
          <td>
            <div class="product-name">{{name}}</div>
            {{#if customization}}
            <div style="font-size: 12px; color: #666;">{{customization}}</div>
            {{/if}}
          </td>
          <td class="text-right">{{quantity}}</td>
          <td class="text-right">{{unitPrice}} FCFA</td>
          <td class="text-right">{{totalPrice}} FCFA</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span>Sous-total :</span>
        <span>{{subtotal}} FCFA</span>
      </div>
      {{#if discount}}
      <div class="totals-row">
        <span>Remise ({{discountPercent}}%) :</span>
        <span>-{{discount}} FCFA</span>
      </div>
      {{/if}}
      <div class="totals-row">
        <span>TVA (18%) :</span>
        <span>{{tax}} FCFA</span>
      </div>
      <div class="totals-row total">
        <span>TOTAL TTC :</span>
        <span>{{total}} FCFA</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>NS2PO - Publicité par l'Objet depuis 2011</strong></p>
      <p>Abidjan, Côte d'Ivoire</p>
      <p>Email: devis@ns2po.ci | Tél: +225 XX XX XX XX XX</p>
      <p style="margin-top: 10px; font-size: 11px;">
        Ce devis est valable 30 jours. Conditions générales disponibles sur demande.
      </p>
    </div>
  </div>
</body>
</html>
```

**Optimisations mobile 3G Côte d'Ivoire :**

1. **Images Cloudinary optimisées :**
```javascript
// Transformation URL Cloudinary
const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_600,c_scale/${publicId}`
```

2. **CSS Inline (pas de fichier externe)**
   - Évite requête HTTP supplémentaire
   - Rendu plus rapide Puppeteer

3. **Fonts System (pas Google Fonts)**
   - `-apple-system, BlinkMacSystemFont, Roboto` : fonts OS
   - Pas de chargement réseau

4. **Palette NS2PO stricte**
   - Primaire : `#C99A3B` (Ocre)
   - Accent : `#6A2B3A` (Bourgogne)
   - Fond : `#F8F8F8`
   - Texte : `#2D2D2D`

---

### Étape 3 : Service Génération PDF (3h)

**Fichier** : `apps/election-mvp/server/services/pdf-generator.ts`

**Code complet :**

```typescript
import puppeteer, { Browser, Page } from 'puppeteer'
import chromium from '@sparticuz/chromium-min'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Handlebars from 'handlebars'

/**
 * Types
 */
interface QuoteData {
  reference: string
  date: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientOrganization?: string
  items: QuoteItem[]
  subtotal: number
  discount?: number
  discountPercent?: number
  tax: number
  total: number
  logoUrl: string
}

interface QuoteItem {
  name: string
  imageUrl: string
  customization?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

/**
 * Configuration Puppeteer Railway
 */
const isProd = process.env.NODE_ENV === 'production'
const chromiumPath = process.env.CHROMIUM_EXECUTABLE_PATH || chromium.executablePath

/**
 * Pool Puppeteer (optionnel - pour volume élevé)
 */
let browserInstance: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance
  }

  browserInstance = await puppeteer.launch({
    executablePath: await chromiumPath,
    args: chromium.args,
    headless: chromium.headless,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  })

  return browserInstance
}

/**
 * Générer HTML depuis template
 */
function renderQuoteHTML(data: QuoteData): string {
  const templatePath = resolve(process.cwd(), 'server/templates/quote-pdf.html')
  const templateSource = readFileSync(templatePath, 'utf-8')
  const template = Handlebars.compile(templateSource)

  return template(data)
}

/**
 * Service principal : Génération PDF
 */
export async function generateQuotePDF(quoteData: QuoteData): Promise<Buffer> {
  let page: Page | null = null

  try {
    console.log(`[PDF Generator] Starting for quote: ${quoteData.reference}`)
    const startTime = Date.now()

    // 1. Générer HTML
    const html = renderQuoteHTML(quoteData)

    // 2. Launch/Get browser
    const browser = await getBrowser()
    page = await browser.newPage()

    // 3. Charger HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Attendre chargement images Cloudinary
      timeout: 10000, // 10s max
    })

    // 4. Générer PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    })

    const duration = Date.now() - startTime
    console.log(`[PDF Generator] Success in ${duration}ms - Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)

    return pdfBuffer

  } catch (error) {
    console.error('[PDF Generator] Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Erreur génération PDF',
      data: error,
    })
  } finally {
    // Fermer page (pas browser pour réutilisation)
    if (page) {
      await page.close()
    }
  }
}

/**
 * Cleanup browser (appeler à shutdown app)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

/**
 * Helper : Formater données Turso → Template
 */
export function formatQuoteData(rawData: any): QuoteData {
  return {
    reference: rawData.reference,
    date: new Date(rawData.createdAt).toLocaleDateString('fr-FR'),
    clientName: rawData.client.name,
    clientEmail: rawData.client.email,
    clientPhone: rawData.client.phone,
    clientOrganization: rawData.client.organization,
    items: rawData.items.map((item: any) => ({
      name: item.product.name,
      imageUrl: optimizeCloudinaryUrl(item.product.imageUrl),
      customization: item.customization,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    })),
    subtotal: rawData.subtotal,
    discount: rawData.discount,
    discountPercent: rawData.discountPercent,
    tax: rawData.tax,
    total: rawData.total,
    logoUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/c_scale,w_150,f_auto/logo-ns2po.png',
  }
}

/**
 * Helper : Optimiser URLs Cloudinary
 */
function optimizeCloudinaryUrl(url: string): string {
  // Format: f_auto (format optimal), q_auto (qualité auto), w_600 (largeur max), c_scale (ratio)
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_600,c_scale/')
  }
  return url
}
```

**Optimisations clés :**

1. **Pool Puppeteer** : Réutilisation browser (-100ms cold start)
2. **Timeout 10s** : Fail-fast si images Cloudinary lentes
3. **networkidle0** : Attendre chargement complet images
4. **Logs détaillés** : Monitoring Railway performance

---

### Étape 4 : API Route Email + PDF (2h)

**Fichier** : `apps/election-mvp/server/api/quotes/send.post.ts`

**Code complet :**

```typescript
import { z } from 'zod'
import { Resend } from 'resend'
import { mjml2html } from 'mjml'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { generateQuotePDF, formatQuoteData } from '~/server/services/pdf-generator'
import { getQuoteById } from '~/server/database/queries/quotes'

/**
 * Configuration Resend
 */
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Validation Zod
 */
const SendQuoteSchema = z.object({
  quoteId: z.string().min(1),
  clientEmail: z.string().email(),
  clientName: z.string().min(2),
})

/**
 * API Route Handler
 */
export default defineEventHandler(async (event) => {
  let pdfBuffer: Buffer | null = null

  try {
    console.log('[Send Quote API] Starting...')

    // 1. Validation body
    const body = await readBody(event)
    const validated = SendQuoteSchema.parse(body)

    // 2. Fetch quote data (Turso)
    const quoteRaw = await getQuoteById(validated.quoteId)

    if (!quoteRaw) {
      throw createError({
        statusCode: 404,
        message: 'Devis introuvable',
      })
    }

    // 3. Formater données pour template
    const quoteData = formatQuoteData(quoteRaw)

    // 4. Générer PDF
    console.log('[Send Quote API] Generating PDF...')
    pdfBuffer = await generateQuotePDF(quoteData)

    // 5. Compiler template email MJML (Phase 2 existant)
    const mjmlPath = resolve(process.cwd(), 'templates/email/devis-minimal.mjml')
    let mjmlContent = readFileSync(mjmlPath, 'utf-8')

    // Variables MJML
    mjmlContent = mjmlContent
      .replace(/{{clientName}}/g, validated.clientName)
      .replace(/{{totalAmount}}/g, quoteData.total.toLocaleString('fr-FR'))
      .replace(/{{ctaUrl}}/g, `${process.env.NUXT_PUBLIC_BASE_URL}/quotes/${validated.quoteId}`)
      .replace(/{{reference}}/g, quoteData.reference)

    const { html: mjmlHtml, errors } = mjml2html(mjmlContent, {
      minify: true,
      keepComments: false,
    })

    if (errors.length > 0) {
      console.error('[Send Quote API] MJML errors:', errors)
    }

    // 6. Envoyer email + PDF via Resend
    console.log('[Send Quote API] Sending email via Resend...')
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'devis@ns2po.ci',
      to: validated.clientEmail,
      subject: `Votre devis NS2PO - ${quoteData.reference}`,
      html: mjmlHtml,
      attachments: [
        {
          filename: `devis-${quoteData.reference}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    if (error) {
      console.error('[Send Quote API] Resend error:', error)

      // Retry 1x
      console.log('[Send Quote API] Retrying...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      const retryResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'devis@ns2po.ci',
        to: validated.clientEmail,
        subject: `Votre devis NS2PO - ${quoteData.reference}`,
        html: mjmlHtml,
        attachments: [
          {
            filename: `devis-${quoteData.reference}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })

      if (retryResult.error) {
        // Fallback: Email sans PDF
        console.warn('[Send Quote API] Fallback: Email without PDF')
        await sendEmailWithoutPDF(validated, quoteData, mjmlHtml)
        await notifyAdmin('PDF attachment failed', { quoteId: validated.quoteId, error: retryResult.error })

        throw createError({
          statusCode: 500,
          message: 'Échec envoi email avec PDF',
          data: retryResult.error,
        })
      }
    }

    // 7. Libérer buffer
    pdfBuffer = null

    // 8. Log succès + Return
    console.log(`[Send Quote API] Success - Email ID: ${data?.id}`)

    return {
      success: true,
      emailId: data?.id,
      message: 'Devis envoyé avec succès',
    }

  } catch (err: any) {
    console.error('[Send Quote API] Error:', err)

    // Libérer buffer en cas d'erreur
    pdfBuffer = null

    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Erreur interne serveur',
      data: err.data,
    })
  }
})

/**
 * Fallback : Email sans PDF
 */
async function sendEmailWithoutPDF(validated: any, quoteData: any, html: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'devis@ns2po.ci',
    to: validated.clientEmail,
    subject: `Votre devis NS2PO - ${quoteData.reference} (sans PDF)`,
    html: html + '<p style="color:red;">Note: Le PDF du devis sera envoyé séparément.</p>',
  })
}

/**
 * Notification admin
 */
async function notifyAdmin(subject: string, data: any) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'devis@ns2po.ci',
    to: 'admin@ns2po.ci',
    subject: `[NS2PO Alert] ${subject}`,
    text: JSON.stringify(data, null, 2),
  })
}
```

**Sécurité & Validation :**

1. ✅ Validation Zod stricte (email, quoteId)
2. ✅ Error handling complet (try/catch)
3. ✅ Retry logic Resend (1x)
4. ✅ Fallback email sans PDF
5. ✅ Notification admin si échec
6. ✅ Logs Railway détaillés

---

### Étape 5 : Tests & Validation (2h)

#### 5.1. Tests Manuels Locaux

**Test 1 : Génération PDF standalone**

```bash
# Créer script test
cat > apps/election-mvp/test-pdf-generator.ts << 'EOF'
import { generateQuotePDF } from './server/services/pdf-generator'
import { writeFileSync } from 'fs'

const mockQuoteData = {
  reference: 'DEV-TEST-001',
  date: '12/11/2025',
  clientName: 'Jean Dupont',
  clientEmail: 'jean@test.com',
  clientPhone: '+225 07 00 00 00 00',
  items: [
    {
      name: 'T-Shirt Personnalisé',
      imageUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/f_auto,q_auto,w_600,c_scale/sample-tshirt.jpg',
      quantity: 100,
      unitPrice: 2500,
      totalPrice: 250000,
    },
    {
      name: 'Casquette Logo',
      imageUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/f_auto,q_auto,w_600,c_scale/sample-cap.jpg',
      quantity: 50,
      unitPrice: 3000,
      totalPrice: 150000,
    },
  ],
  subtotal: 400000,
  tax: 72000,
  total: 472000,
  logoUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/c_scale,w_150,f_auto/logo-ns2po.png',
}

async function testPDF() {
  try {
    console.log('Generating PDF...')
    const buffer = await generateQuotePDF(mockQuoteData)

    writeFileSync('./test-devis.pdf', buffer)
    console.log('✅ PDF generated: ./test-devis.pdf')
    console.log(`Size: ${(buffer.length / 1024).toFixed(2)} KB`)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testPDF()
EOF

# Exécuter
npx tsx apps/election-mvp/test-pdf-generator.ts

# Vérifier PDF
open test-devis.pdf  # macOS
# ou xdg-open test-devis.pdf  # Linux
```

**Critères validation :**
- ✅ PDF généré sans erreur
- ✅ Layout correct (header, tableau, totaux, footer)
- ✅ Images Cloudinary chargées
- ✅ Branding NS2PO (#C99A3B, #6A2B3A)
- ✅ Taille < 2 MB

**Test 2 : API Route complète**

```bash
# 1. Lancer serveur dev
pnpm dev

# 2. Test API (dans nouveau terminal)
curl -X POST http://localhost:3003/api/quotes/send \
  -H "Content-Type: application/json" \
  -d '{
    "quoteId": "test-quote-123",
    "clientEmail": "votre-email@test.com",
    "clientName": "Test Client"
  }'

# 3. Vérifier logs serveur
# 4. Vérifier email reçu + PDF attachment
```

**Critères validation :**
- ✅ API retourne 200 + emailId
- ✅ Email reçu inbox (pas spam)
- ✅ PDF attachment téléchargeable
- ✅ Temps total < 1s (logs Railway)

#### 5.2. Tests E2E Playwright (Optionnel MVP)

**Fichier** : `apps/election-mvp/tests/e2e/quote-pdf-email.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Quote PDF Email Flow', () => {
  test('Génération et envoi devis PDF', async ({ page }) => {
    // 1. Naviguer vers page devis
    await page.goto('http://localhost:3003/quotes/new')

    // 2. Remplir panier
    await page.click('[data-testid="add-product-1"]')
    await page.fill('[data-testid="quantity"]', '10')

    // 3. Soumettre coordonnées
    await page.fill('[data-testid="client-name"]', 'E2E Test')
    await page.fill('[data-testid="client-email"]', 'e2e@test.com')
    await page.fill('[data-testid="client-phone"]', '+225070000000')

    // 4. Mock API Resend
    await page.route('**/api/quotes/send', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      // Vérifier présence données
      expect(postData.quoteId).toBeTruthy()
      expect(postData.clientEmail).toBe('e2e@test.com')

      // Mock réponse succès
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          emailId: 'mock-email-id-123',
        }),
      })
    })

    // 5. Soumettre formulaire
    await page.click('[data-testid="submit-quote"]')

    // 6. Vérifier confirmation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=Devis envoyé')).toBeVisible()
  })

  test('Génération PDF performance < 600ms', async ({ page }) => {
    const start = Date.now()

    // Appeler API directement
    const response = await page.request.post('http://localhost:3003/api/quotes/send', {
      data: {
        quoteId: 'perf-test-123',
        clientEmail: 'perf@test.com',
        clientName: 'Perf Test',
      },
    })

    const duration = Date.now() - start

    // Assert
    expect(response.status()).toBe(200)
    expect(duration).toBeLessThan(600) // Target < 600ms

    console.log(`PDF generation time: ${duration}ms`)
  })
})
```

**Exécuter tests :**

```bash
# E2E complet
pnpm test:e2e

# Avec UI (debugging)
pnpm test:e2e:ui

# Rapport
pnpm test:e2e:report
```

#### 5.3. Validation Performance Railway

**Monitoring logs Railway :**

```bash
# Logs temps réel
railway logs --tail

# Filtrer génération PDF
railway logs --tail | grep "PDF Generator"

# Exemple output attendu:
# [PDF Generator] Starting for quote: QUOTE-2025-001
# [PDF Generator] Success in 420ms - Size: 1.2 MB
# [Send Quote API] Success - Email ID: re_abc123xyz
```

**Métriques cibles :**

| Métrique | Target | Mesure |
|----------|--------|--------|
| Génération PDF | < 400ms | Logs Railway |
| API response totale | < 600ms | curl -w "%{time_total}" |
| Taille PDF | < 2 MB | Buffer.length / 1024 / 1024 |
| Délivrabilité email | 100% | Dashboard Resend |
| Taux ouverture | > 50% | Dashboard Resend (J+1) |

---

### Étape 6 : Déploiement Railway (1h)

#### 6.1. Configuration Railway

**Variables environnement :**

```bash
# Vérifier variables existantes
railway variables

# Ajouter variables PDF
railway variables --set "CHROMIUM_EXECUTABLE_PATH=/tmp/chromium"
railway variables --set "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true"
railway variables --set "PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer"

# Vérifier Resend (Phase 2)
railway variables | grep RESEND
```

**Build settings Railway (si nécessaire) :**

```bash
# Railway automatique détecte Nuxt 3
# Vérifier runtime V2 activé
railway variables --set "RAILWAY_BETA_ENABLE_BUILD_V2=1"
```

#### 6.2. Build & Deploy

**Commandes :**

```bash
# 1. Build local (vérification)
cd apps/election-mvp
pnpm build --force

# 2. Type-check + Lint
pnpm type-check
pnpm lint

# 3. Deploy Railway
railway up --detach

# 4. Surveiller logs
railway logs --tail
```

**Vérifier build Railway :**

```bash
# Dashboard Railway : Build logs
# Vérifier:
# - ✅ Installation puppeteer + chromium-min
# - ✅ Nuxt build success
# - ✅ No TypeScript errors
# - ✅ Deploy success
```

#### 6.3. Tests Production

**Test 1 : Health check**

```bash
# API health
curl https://ns2po-railway.app/api/health

# Expected: { "status": "ok", "turso": "up" }
```

**Test 2 : Envoi devis production**

```bash
# Endpoint production
curl -X POST https://ns2po-railway.app/api/quotes/send \
  -H "Content-Type: application/json" \
  -d '{
    "quoteId": "PROD-TEST-001",
    "clientEmail": "votre-email@test.com",
    "clientName": "Test Production"
  }'

# Expected:
# {
#   "success": true,
#   "emailId": "re_xxxxx",
#   "message": "Devis envoyé avec succès"
# }
```

**Test 3 : Vérification email**

1. ✅ Email reçu inbox (pas spam)
2. ✅ PDF attachment présent
3. ✅ PDF téléchargeable et lisible
4. ✅ Images Cloudinary chargées
5. ✅ Layout correct mobile/desktop

**Test 4 : Dashboard Resend**

```
https://resend.com/emails

Vérifier:
- Status: delivered
- Open rate: À suivre J+1
- Bounce rate: 0%
- Spam complaints: 0
```

#### 6.4. Monitoring Continue (Semaine 1)

**Railway Analytics :**

```bash
# Logs quotidiens
railway logs --since 24h | grep "PDF Generator"

# Métriques Railway
railway status
```

**Dashboard Resend :**

| Jour | Emails Envoyés | Delivered | Opened | Bounced | Spam |
|------|----------------|-----------|--------|---------|------|
| J+1  | 10             | 10 (100%) | 5 (50%)| 0 (0%)  | 0    |
| J+2  | 25             | 25 (100%) | 13 (52%)| 0 (0%)  | 0    |
| J+7  | 50             | 49 (98%)  | 26 (52%)| 1 (2%)  | 0    |

**Alertes à configurer :**

1. ❌ Bounce rate > 5% → Vérifier emails clients
2. ❌ Spam rate > 0 → Vérifier contenu email
3. ❌ Erreurs PDF > 1% → Vérifier logs Railway
4. ❌ API latency > 1s → Optimiser Puppeteer

---

## ⏱️ Timeline Totale : 10h30

| Étape | Description | Durée | Cumul | Priorité |
|-------|-------------|-------|-------|----------|
| 1 | Installation dépendances + config | 30min | 0h30 | 🔴 Critique |
| 2 | Template HTML devis + optimisations | 2h | 2h30 | 🔴 Critique |
| 3 | Service génération PDF Puppeteer | 3h | 5h30 | 🔴 Critique |
| 4 | API Route email + PDF Resend | 2h | 7h30 | 🔴 Critique |
| 5 | Tests manuels + E2E (optionnel) | 2h | 9h30 | 🟠 Important |
| 6 | Déploiement Railway + validation prod | 1h | 10h30 | 🔴 Critique |

**Planning suggéré :**

- **Jour 1 (4h)** : Étapes 1-2 (Installation + Template)
- **Jour 2 (4h)** : Étape 3 (Service PDF)
- **Jour 3 (2h30)** : Étapes 4-6 (API + Deploy + Tests)

---

## 🎯 Critères de Succès MVP

### Techniques

| Critère | Target | Mesure | Status |
|---------|--------|--------|--------|
| **Génération PDF** | < 400ms | Railway logs | ⏳ |
| **API response totale** | < 600ms | curl timing | ⏳ |
| **Taille PDF** | < 2 MB | Buffer.length | ⏳ |
| **Bundle Railway** | < 100 MB | Build logs | ⏳ |
| **Cold start** | < 500ms | Premier appel API | ⏳ |

### Business

| Critère | Target | Mesure | Status |
|---------|--------|--------|--------|
| **Délivrabilité email** | ≥ 95% | Dashboard Resend | ⏳ |
| **Taux ouverture** | ≥ 50% | Dashboard Resend J+1 | ⏳ |
| **Taux téléchargement PDF** | ≥ 80% | Analytics custom (optionnel) | ⏳ |
| **Bounce rate** | < 5% | Dashboard Resend | ⏳ |
| **Spam complaints** | 0% | Dashboard Resend | ⏳ |

### Qualité

| Critère | Target | Mesure | Status |
|---------|--------|--------|--------|
| **Zéro erreur Railway** | 7 jours | Logs monitoring | ⏳ |
| **TypeScript strict** | 100% | `pnpm type-check` | ⏳ |
| **ESLint clean** | 100% | `pnpm lint` | ⏳ |
| **Tests E2E pass** | 100% | `pnpm test:e2e` | ⏳ |

---

## 🚫 Hors Scope MVP

**Reporté à V2 (si besoin validé après 2-4 semaines) :**

- ❌ **Stockage PDF durable** (S3/Cloudinary) : MVP email attachment suffit
- ❌ **Lien téléchargement PDF** : Nécessite storage + sécurité
- ❌ **PDF multi-langues** : Français uniquement MVP
- ❌ **Génération asynchrone** (queue) : Synchrone < 1s acceptable
- ❌ **Signature électronique PDF** : Légal complexe Côte d'Ivoire
- ❌ **Watermark dynamique** : Over-engineering MVP
- ❌ **PDF éditable** : Use case non validé
- ❌ **Archivage automatique** : RGPD scope V2
- ❌ **Analytics PDF** (tracking ouvertures) : Dashboard Resend suffit
- ❌ **A/B testing templates** : Volume insuffisant MVP

**Principe MVP** : Ne construire QUE ce qui permet de valider l'hypothèse métier en < 2 semaines.

---

## 📚 Conformité delivery-quotes-email.md Phase 2

### Intégration Existante

| Élément Phase 2 | Réutilisation PDF | Modification |
|-----------------|-------------------|--------------|
| **Template MJML** | ✅ Réutilisé tel quel | Aucune |
| **API Resend** | ✅ Ajout `attachments` | Mineure |
| **Variables env** | ✅ `RESEND_API_KEY` existant | Aucune |
| **Validation Zod** | ✅ Extension schéma | Mineure |
| **Error handling** | ✅ Fallback SMTP maintenu | Aucune |
| **Logs Railway** | ✅ Format unifié | Aucune |

### Flux Combiné Phase 2 + PDF

```
[Validation Panier Client]
         ↓
[API: /server/api/quotes/send.post.ts]
         ↓
    ┌────────────────────────────────────┐
    │ Phase 2: Template MJML Email       │ ← Existant
    │ - Compilation MJML → HTML          │
    │ - Variables: clientName, total...  │
    └────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────┐
    │ PDF: Génération Puppeteer          │ ← Nouveau
    │ - HTML template → PDF Buffer       │
    │ - Images Cloudinary optimisées     │
    └────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────┐
    │ Resend API (Phase 2 + PDF)         │ ← Extension
    │ - from: devis@ns2po.ci             │
    │ - html: mjmlCompiled               │
    │ - attachments: [pdfBuffer]         │ ← Ajout
    └────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────┐
    │ Fallback SMTP (Phase 2)            │ ← Maintenu
    │ - Si Resend échoue                 │
    │ - Email sans PDF + notification    │
    └────────────────────────────────────┘
         ↓
[Client reçoit Email + PDF joint]
```

**Note importante** : Le système PDF **complète** Phase 2, ne la **remplace pas**. Aucune régression possible sur l'envoi email existant.

---

## 🔄 Plan de Rollback (Si Échec)

### Scénario 1 : Erreurs génération PDF > 10%

**Actions immédiates :**

1. ✅ Désactiver génération PDF (feature flag)
2. ✅ Envoyer email sans PDF (fallback Phase 2)
3. ✅ Analyser logs Railway (cold start ? images Cloudinary ?)
4. ✅ Rollback Railway si nécessaire : `railway rollback`

**Diagnostic :**

```bash
# Logs Railway détaillés
railway logs --since 1h | grep "PDF Generator"

# Erreurs communes
# - Timeout Cloudinary images (> 10s)
# - OOM Puppeteer (RAM insuffisante)
# - Chromium binary manquant (path incorrect)
```

### Scénario 2 : Performance < Target (> 1s)

**Optimisations rapides :**

1. ✅ Réduire qualité images Cloudinary (`q_80` au lieu de `q_auto`)
2. ✅ Augmenter RAM Railway (plan upgrade)
3. ✅ Activer pool Puppeteer (réutilisation browser)
4. ✅ Async generation + email différé (si acceptable UX)

### Scénario 3 : Bounce rate email > 5%

**Actions immédiates :**

1. ✅ Vérifier taille PDF < 10 MB (limite serveurs email)
2. ✅ Tester mail-tester.com (score ≥ 9/10)
3. ✅ Vérifier DNS Resend (SPF, DKIM)
4. ✅ Fallback : Lien téléchargement au lieu d'attachment

**Principe** : Toujours privilégier délivrabilité email sur PDF.

---

## 📖 Ressources & Documentation

### Documentation Officielle

| Technologie | Lien | Priorité |
|-------------|------|----------|
| **Puppeteer** | https://pptr.dev | ⭐⭐⭐ |
| **Chromium Railway** | https://github.com/Sparticuz/chromium | ⭐⭐⭐ |
| **Resend API** | https://resend.com/docs/api-reference/emails/send-email | ⭐⭐⭐ |
| **MJML** | https://mjml.io/documentation | ⭐⭐ |
| **Nuxt PDF Module** | https://sidebase.io/nuxt-pdf | ⭐⭐ |
| **Railway Docs** | https://docs.railway.app | ⭐⭐⭐ |
| **Cloudinary Transformations** | https://cloudinary.com/documentation/transformation_reference | ⭐⭐ |

### Articles & Benchmarks (Sources Recherche 2025)

**Gemini Copilot (Google Search Grounding) - 23 sources :**

1. pdforge.com - "Puppeteer PDF Generation Best Practices 2024"
2. pdfbolt.com - "Node.js PDF Libraries Comparison"
3. dev.to - "Generating PDFs with Puppeteer in Production"
4. codepasta.com - "Serverless PDF Generation Performance"
5. nuxt.com - "Nuxt PDF Modules Overview"
6. medium.com - "Railway + Puppeteer: Cold Start Optimization"
7. stackoverflow.com - "Puppeteer memory leaks in serverless"
8. [+ 16 autres sources citées dans rapport Gemini]

**Perplexity Copilot (Sonar Pro) :**

- Railway Runtime V2 PDF generation benchmarks
- Resend attachment limits and best practices
- Puppeteer vs Playwright serverless comparison
- Cloudinary image optimization for PDFs
- Mobile 3G performance considerations Côte d'Ivoire

### Support & Communauté

| Canal | Usage | Réponse |
|-------|-------|---------|
| **Resend Discord** | Issues email delivery | < 24h |
| **Railway Discord** | Deploy issues, performance | < 12h |
| **Puppeteer GitHub Issues** | Bugs, feature requests | 2-7 jours |
| **Stack Overflow** | Questions techniques | Variable |

---

## 🏁 Prochaines Étapes (Post-MVP)

### Semaine 1-2 : Monitoring & Stabilisation

- ✅ Surveiller métriques quotidiennes (Resend + Railway)
- ✅ Collecter feedback clients (5-10 devis envoyés)
- ✅ Optimiser performance si < targets
- ✅ Documenter incidents + résolutions

### Semaine 3-4 : Itérations V1.1

**Si succès MVP validé :**

1. **Optimisation performance** : Pool Puppeteer avancé, cache HTML
2. **Template PDF enrichi** : QR code tracking, logos partenaires
3. **Analytics custom** : Tracking téléchargements PDF
4. **Tests E2E automatisés** : CI/CD Playwright

**Si échec MVP :**

1. Rollback génération PDF
2. Alternative : Lien téléchargement (Cloudinary storage)
3. Ou : Service externe (PDFShift, Gotenberg self-hosted)

### V2 (Si Volume > 100 devis/mois)

- Génération asynchrone (BullMQ + Redis)
- Archivage automatique (S3 + rétention 1 an)
- Multi-langues (EN, FR)
- Signature électronique (DocuSign, HelloSign)
- A/B testing templates

---

## ✅ Checklist Démarrage Implémentation

**Avant de commencer :**

- [ ] Lire intégralement ce plan
- [ ] Valider priorités avec équipe
- [ ] Vérifier accès Railway + Resend
- [ ] Créer branche Git : `feat/pdf-quote-generation`
- [ ] Estimer timeline réaliste (10h30 suggéré)

**Pendant implémentation :**

- [ ] Suivre étapes 1-6 séquentiellement
- [ ] Tester après chaque étape
- [ ] Commiter régulièrement (Conventional Commits)
- [ ] Documenter blockers + décisions

**Après implémentation :**

- [ ] Tests production complets
- [ ] Monitoring actif semaine 1
- [ ] Documentation technique à jour
- [ ] Rétro équipe + plan V1.1

---

**Version** : 1.0
**Dernière mise à jour** : 12 Novembre 2025
**Prochaine révision** : Post-MVP (Semaine 2)

---

## 📞 Contact & Support

**Questions techniques :**
- Claude Code : `/help` ou GitHub Issues
- Railway : https://railway.app/help
- Resend : https://resend.com/support

**Équipe NS2PO :**
- Architecture : NS2PO-Architect (ce plan)
- DevOps : Logs Railway + monitoring
- Product : Validation MVP + feedback clients
