/**
 * API Route: Send Quote Email with PDF
 *
 * POST /api/quotes/send
 *
 * Génère un PDF de devis et l'envoie par email via Resend
 * Performance target: <600ms total (génération PDF + envoi email)
 *
 * @module server/api/quotes/send
 */

import { Resend } from 'resend'
import mjml2html from 'mjml'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  generateQuotePDF,
  type QuoteData,
  type QuoteItem,
} from '../../services/pdf-generator'

// Note: defineEventHandler, readBody, createError, useRuntimeConfig
// sont auto-importés par Nuxt au runtime

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

const SendQuoteEmailSchema = z.object({
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

type SendQuoteEmailInput = z.infer<typeof SendQuoteEmailSchema>

// ============================================================================
// Resend Client Initialization
// ============================================================================

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (resendClient) {
    return resendClient
  }

  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Resend API key not configured',
    })
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

// ============================================================================
// MJML Template Compilation
// ============================================================================

/**
 * Compile MJML email template with data
 */
function compileEmailTemplate(data: {
  clientName: string
  totalAmount: string
  ctaUrl: string
  reference: string
}): string {
  try {
    // Lire template MJML
    const templatePath = resolve(
      process.cwd(),
      'templates/email/devis-minimal.mjml'
    )
    let mjmlContent = readFileSync(templatePath, 'utf-8')

    // Remplacer variables
    mjmlContent = mjmlContent
      .replace(/\{\{clientName\}\}/g, data.clientName)
      .replace(/\{\{totalAmount\}\}/g, data.totalAmount)
      .replace(/\{\{ctaUrl\}\}/g, data.ctaUrl)
      .replace(/\{\{reference\}\}/g, data.reference)

    // Compiler MJML → HTML
    const { html, errors } = mjml2html(mjmlContent, {
      minify: true,
      keepComments: false,
    })

    if (errors.length > 0) {
      console.error('[Email Template] MJML compilation errors:', errors)
      throw new Error('MJML compilation failed')
    }

    return html
  } catch (error: any) {
    console.error('[Email Template] Error:', error)
    throw createError({
      statusCode: 500,
      message: `Email template compilation failed: ${error.message}`,
    })
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('[Quote Email API] Request received')

    // 1. Validation du body avec Zod
    const body = await readBody(event)
    const validated = SendQuoteEmailSchema.parse(body)

    console.log(`[Quote Email API] Validated data for ${validated.reference}`)

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
    console.log('[Quote Email API] Generating PDF...')
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
      `[Quote Email API] PDF generated: ${(pdfResult.size / 1024).toFixed(2)}KB in ${pdfResult.generationTime}ms`
    )

    // 4. Compiler template email MJML
    console.log('[Quote Email API] Compiling email template...')
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl || 'http://localhost:3000'
    const ctaUrl = `${siteUrl}/devis/${validated.reference}`

    const emailHtml = compileEmailTemplate({
      clientName: validated.clientName,
      totalAmount: validated.total.toLocaleString('fr-FR'),
      ctaUrl,
      reference: validated.reference,
    })

    // 5. Envoyer email via Resend avec PDF en attachment
    console.log('[Quote Email API] Sending email via Resend...')
    const resend = getResendClient()
    const fromEmail = config.resendFromEmail || 'noreply@send.reachup.site'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: validated.clientEmail,
      subject: `Votre devis NS2PO - ${validated.reference}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Devis_NS2PO_${validated.reference}.pdf`,
          content: pdfResult.buffer,
        },
      ],
    })

    // 6. Gestion erreur Resend
    if (error) {
      console.error('[Quote Email API] Resend error:', error)

      // Fallback: Logger l'erreur mais ne pas échouer totalement
      // Dans une version future, on pourrait implémenter un fallback SMTP
      throw createError({
        statusCode: 500,
        message: 'Email sending failed via Resend',
        data: {
          resendError: error,
          pdfGenerated: true,
          pdfSize: pdfResult.size,
        },
      })
    }

    // 7. Succès !
    const totalTime = Date.now() - startTime

    console.log(
      `[Quote Email API] Success! Email sent in ${totalTime}ms total (emailId: ${data?.id})`
    )

    // Validation performance
    if (totalTime > 600) {
      console.warn(
        `[Quote Email API] Performance warning: ${totalTime}ms > 600ms target`
      )
    }

    return {
      success: true,
      emailId: data?.id,
      reference: validated.reference,
      pdfSize: pdfResult.size,
      pdfGenerationTime: pdfResult.generationTime,
      totalTime,
      message: 'Email envoyé avec succès',
    }
  } catch (error: any) {
    const totalTime = Date.now() - startTime

    console.error('[Quote Email API] Error:', error)

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
