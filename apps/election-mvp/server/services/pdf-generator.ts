/**
 * PDF Generator Service
 *
 * Service de génération de PDF pour les devis NS2PO
 * Utilise Puppeteer + Chromium système (Debian) pour Railway
 * Performance target: <400ms génération, <2MB taille
 *
 * Migration: @sparticuz/chromium → Chromium système Debian Bookworm
 * Basé sur recommandations Gemini + Google Search Grounding (2025)
 *
 * @module server/services/pdf-generator
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import Handlebars from 'handlebars'
import { QUOTE_PDF_TEMPLATE } from '../templates/quote-pdf-template'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Quote item interface
 */
export interface QuoteItem {
  name: string
  imageUrl: string
  customization?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

/**
 * Quote data interface
 */
export interface QuoteData {
  reference: string
  date: string
  clientName: string
  clientEmail: string
  clientPhone: string
  items: QuoteItem[]
  subtotal: number
  discount?: number
  discountPercent?: number
  tax: number
  total: number
  logoUrl: string
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter'
  printBackground?: boolean
  preferCSSPageSize?: boolean
  timeout?: number
}

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  buffer: Buffer
  size: number
  generationTime: number
  success: boolean
  error?: string
}

// ============================================================================
// Browser Pool Management
// ============================================================================

let browserInstance: Browser | null = null
let browserInitializing = false

/**
 * Get or create browser instance (singleton pattern for performance)
 * Railway Runtime V2 avec Chromium système Debian Bookworm
 *
 * Configuration:
 * - Production: Utilise PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium (Debian)
 * - Dev local: Utilise Puppeteer bundled Chromium
 */
async function getBrowser(): Promise<Browser> {
  // Si browser existe et est connecté, le retourner
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  // Si browser est en cours d'initialisation, attendre
  if (browserInitializing) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return getBrowser()
  }

  // Initialiser nouveau browser
  browserInitializing = true

  try {
    const isProduction = process.env.NODE_ENV === 'production'
    const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined

    // Configuration Railway avec Chromium système Debian (plus stable que @sparticuz)
    if (isProduction && isRailway) {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'

      console.log(`[PDF Generator] Using system Chromium: ${executablePath}`)

      browserInstance = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
      })
    } else {
      // Configuration local development (utilise Puppeteer bundled Chromium)
      console.log('[PDF Generator] Using Puppeteer bundled Chromium (dev mode)')

      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })
    }

    console.log('[PDF Generator] Browser instance created successfully')
    return browserInstance
  } catch (error) {
    console.error('[PDF Generator] Browser initialization error:', error)
    throw error
  } finally {
    browserInitializing = false
  }
}

/**
 * Close browser instance (cleanup)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
    console.log('[PDF Generator] Browser instance closed')
  }
}

// ============================================================================
// Helpers Functions
// ============================================================================

/**
 * Format quote data for template rendering
 * Formate les nombres avec séparateurs de milliers
 */
export function formatQuoteData(data: QuoteData): QuoteData {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return {
    ...data,
    subtotal: formatNumber(data.subtotal) as any,
    discount: data.discount ? formatNumber(data.discount) as any : undefined,
    discountPercent: data.discountPercent,
    tax: formatNumber(data.tax) as any,
    total: formatNumber(data.total) as any,
    items: data.items.map((item) => ({
      ...item,
      unitPrice: formatNumber(item.unitPrice) as any,
      totalPrice: formatNumber(item.totalPrice) as any,
      imageUrl: optimizeCloudinaryUrl(item.imageUrl),
    })),
    logoUrl: optimizeCloudinaryUrl(data.logoUrl),
  }
}

/**
 * Optimize Cloudinary URLs for PDF rendering
 * Performance: f_auto, q_auto, w_600, c_scale
 * Timeout: 10s max pour éviter blocage
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url) return ''

  // Si déjà une URL Cloudinary
  if (url.includes('res.cloudinary.com')) {
    // Vérifier si déjà optimisée
    if (url.includes('f_auto') && url.includes('q_auto')) {
      return url
    }

    // Insérer transformations après /upload/
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_auto,w_600,c_scale/${parts[1]}`
    }
  }

  return url
}

/**
 * Compile Handlebars template with data
 * Utilise template embarqué pour garantir disponibilité en production
 */
function compileTemplate(data: QuoteData): string {
  try {
    const template = Handlebars.compile(QUOTE_PDF_TEMPLATE)
    return template(data)
  } catch (error) {
    console.error('[PDF Generator] Template compilation error:', error)
    throw new Error(`Template compilation failed: ${error}`)
  }
}

// ============================================================================
// Main PDF Generation Function
// ============================================================================

/**
 * Generate PDF from quote data
 *
 * @param data - Quote data to render
 * @param options - PDF generation options
 * @returns PDF generation result with buffer
 *
 * @example
 * const result = await generateQuotePDF({
 *   reference: 'DEV-2025-001',
 *   clientName: 'Jean Dupont',
 *   items: [...],
 *   total: 1250000
 * })
 */
export async function generateQuotePDF(
  data: QuoteData,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  const startTime = Date.now()
  let page: Page | undefined

  try {
    console.log(`[PDF Generator] Starting PDF generation for ${data.reference}`)

    // 1. Format data
    const formattedData = formatQuoteData(data)

    // 2. Compile template (template embarqué)
    const html = compileTemplate(formattedData)

    // 3. Get browser instance
    const browser = await getBrowser()
    page = await browser.newPage()

    // 4. Configure page
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: options.timeout || 10000, // 10s max
    })

    // 5. Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: options.printBackground ?? true,
      preferCSSPageSize: options.preferCSSPageSize ?? true,
      margin: {
        top: '15px',
        right: '15px',
        bottom: '15px',
        left: '15px',
      },
    })

    // 6. Close page
    await page.close()

    const generationTime = Date.now() - startTime
    const size = pdfBuffer.length

    console.log(
      `[PDF Generator] PDF generated successfully: ${(size / 1024).toFixed(2)}KB in ${generationTime}ms`
    )

    // Validation performance
    if (generationTime > 600) {
      console.warn(
        `[PDF Generator] Performance warning: ${generationTime}ms > 600ms target`
      )
    }

    if (size > 2 * 1024 * 1024) {
      console.warn(
        `[PDF Generator] Size warning: ${(size / 1024 / 1024).toFixed(2)}MB > 2MB target`
      )
    }

    return {
      buffer: Buffer.from(pdfBuffer),
      size,
      generationTime,
      success: true,
    }
  } catch (error: any) {
    const generationTime = Date.now() - startTime

    console.error('[PDF Generator] Generation error:', error)

    // Close page si erreur
    if (page) {
      await page.close().catch(() => {})
    }

    return {
      buffer: Buffer.from([]),
      size: 0,
      generationTime,
      success: false,
      error: error.message || 'PDF generation failed',
    }
  }
}

// ============================================================================
// Cleanup on process exit
// ============================================================================

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('[PDF Generator] SIGINT received, closing browser...')
    await closeBrowser()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('[PDF Generator] SIGTERM received, closing browser...')
    await closeBrowser()
    process.exit(0)
  })
}
