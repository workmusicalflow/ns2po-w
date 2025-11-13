/**
 * API Route: Test PDF Generation Only
 *
 * POST /api/quotes/test-pdf
 *
 * Génère un PDF de devis sans envoi email (test Chromium + Handlebars)
 * Retourne le PDF en base64 pour vérification
 *
 * @module server/api/quotes/test-pdf
 */

import { z } from 'zod'
import {
  generateQuotePDF,
  type QuoteData,
  type QuoteItem,
} from '../../services/pdf-generator'

// ============================================================================
// Validation Schema (Zod)
// ============================================================================

const QuoteItemSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url(),
  customization: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
})

const TestPDFSchema = z.object({
  // Client info
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(8),

  // Quote data
  reference: z.string().min(5),
  items: z.array(QuoteItemSchema).min(1),
  subtotal: z.number().positive(),
  discount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  tax: z.number().min(0),
  total: z.number().positive(),

  // Assets
  logoUrl: z.string().url(),
})

type TestPDFInput = z.infer<typeof TestPDFSchema>

// ============================================================================
// Main Handler
// ============================================================================

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('[Test PDF API] Request received')

    // 1. Validation du body avec Zod
    const body = await readBody(event)
    const validated = TestPDFSchema.parse(body)

    console.log(`[Test PDF API] Validated data for ${validated.reference}`)

    // 2. Préparer données pour PDF
    const pdfData: QuoteData = {
      reference: validated.reference,
      date: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      clientName: validated.clientName,
      clientEmail: validated.clientEmail,
      clientPhone: validated.clientPhone,
      items: validated.items as QuoteItem[],
      subtotal: validated.subtotal,
      discount: validated.discount,
      discountPercent: validated.discountPercent,
      tax: validated.tax,
      total: validated.total,
      logoUrl: validated.logoUrl,
    }

    // 3. Générer PDF
    console.log('[Test PDF API] Generating PDF...')
    const pdfResult = await generateQuotePDF(pdfData, {
      timeout: 10000, // 10s max
    })

    if (!pdfResult.success) {
      throw createError({
        statusCode: 500,
        message: `PDF generation failed: ${pdfResult.error}`,
      })
    }

    console.log(
      `[Test PDF API] PDF generated: ${(pdfResult.size / 1024).toFixed(2)}KB in ${pdfResult.generationTime}ms`
    )

    // 4. Succès !
    const totalTime = Date.now() - startTime

    console.log(
      `[Test PDF API] Success! PDF generated in ${totalTime}ms total`
    )

    // Validation performance
    if (totalTime > 600) {
      console.warn(
        `[Test PDF API] Performance warning: ${totalTime}ms > 600ms target`
      )
    }

    // Retourner les métadonnées + PDF en base64
    return {
      success: true,
      reference: validated.reference,
      pdfSize: pdfResult.size,
      pdfGenerationTime: pdfResult.generationTime,
      totalTime,
      message: 'PDF généré avec succès',
      // PDF en base64 pour inspection (limité à 1MB pour éviter timeout)
      pdfBase64: pdfResult.size < 1024 * 1024
        ? pdfResult.buffer.toString('base64')
        : '[PDF trop volumineux pour retour inline]',
    }
  } catch (error: any) {
    const totalTime = Date.now() - startTime

    console.error('[Test PDF API] Error:', error)

    // Erreur de validation Zod
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: {
          issues: error.issues,
        },
      })
    }

    // Erreur déjà gérée (createError)
    if (error.statusCode) {
      throw error
    }

    // Erreur inconnue
    throw createError({
      statusCode: 500,
      message: error.message || 'Internal server error',
      data: {
        error: error.toString(),
        totalTime,
      },
    })
  }
})
