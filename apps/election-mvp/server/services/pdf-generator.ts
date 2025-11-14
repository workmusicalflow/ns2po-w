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
 * Fetch image from URL and convert to Base64 data URI
 * Solution validée par Gemini + Google Search Grounding (16 sources)
 *
 * @param url - Image URL to fetch
 * @param mimeType - MIME type (default: image/jpeg)
 * @returns Base64 data URI string
 */
async function fetchImageAsBase64(url: string, mimeType: string = 'image/jpeg'): Promise<string> {
  try {
    console.log(`[PDF Generator] Fetching image: ${url}`)

    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`[PDF Generator] Failed to fetch image ${url}: ${response.statusText}`)
      return '' // Return empty string on error
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUri = `data:${mimeType};base64,${base64}`

    console.log(`[PDF Generator] Image converted to Base64: ${url} (${(base64.length / 1024).toFixed(2)}KB)`)
    return dataUri
  } catch (error) {
    console.error(`[PDF Generator] Error fetching image ${url}:`, error)
    return '' // Return empty string on error
  }
}

/**
 * Format quote data for template rendering
 * Convertit les images en Base64 pour garantir affichage dans PDF
 * Formate les nombres avec séparateurs de milliers
 */
export async function formatQuoteData(data: QuoteData): Promise<QuoteData> {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // Convert logo to Base64
  const logoBase64 = await fetchImageAsBase64(data.logoUrl, 'image/jpeg')

  // Convert product images to Base64
  const itemsWithBase64 = await Promise.all(
    data.items.map(async (item) => ({
      ...item,
      unitPrice: formatNumber(item.unitPrice) as any,
      totalPrice: formatNumber(item.totalPrice) as any,
      imageUrl: await fetchImageAsBase64(item.imageUrl, 'image/jpeg'),
    }))
  )

  return {
    ...data,
    subtotal: formatNumber(data.subtotal) as any,
    discount: data.discount ? formatNumber(data.discount) as any : undefined,
    discountPercent: data.discountPercent,
    tax: formatNumber(data.tax) as any,
    total: formatNumber(data.total) as any,
    items: itemsWithBase64,
    logoUrl: logoBase64,
  }
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

    // 1. Format data + Convert images to Base64 (Gemini solution)
    console.log('[PDF Generator] Converting images to Base64...')
    const formattedData = await formatQuoteData(data)

    // 2. Compile template (template embarqué avec images Base64)
    const html = compileTemplate(formattedData)

    // 3. Get browser instance
    const browser = await getBrowser()
    page = await browser.newPage()

    // 4. Set content with Base64 images
    // domcontentloaded suffisant car images embarquées (plus rapide que networkidle0)
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeout || 10000, // 10s max
    })

    // 5. Wait for all images to be complete (extra safety layer)
    // Solution Gemini - garantit que toutes les images Base64 sont chargées
    await page.evaluate(async () => {
      const images = Array.from(document.images)
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
      }))
    })

    console.log('[PDF Generator] All images loaded, generating PDF...')

    // 6. Generate PDF
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
