/**
 * API Route pour soumettre un formulaire de contact
 */

import type { ContactFormData, ContactSubmissionResponse } from '@ns2po/types'
import { createTursoClient, generateId, formatDateForDB, stringifyForDB } from '@ns2po/database'
import { sendOrderNotification, sendCustomerConfirmation } from '../../utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as ContactFormData

    // Validation côté serveur
    if (!body.customer?.email || !body.subject || !body.message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Champs obligatoires manquants'
      })
    }

    // Génération d'un ID unique pour le contact
    const contactId = generateId('CONTACT')

    // Sauvegarder en base de données Turso
    const db = createTursoClient()
    
    await db.execute(
      `INSERT INTO contacts (
        id, type, customer_data, subject, message, priority, status, 
        related_quote_id, attachments, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contactId,
        body.type,
        stringifyForDB(body.customer),
        body.subject,
        body.message,
        body.priority || 'medium',
        'new',
        body.relatedQuote || null,
        stringifyForDB(body.attachments || []),
        stringifyForDB({
          preferredContactMethod: body.preferredContactMethod,
          urgency: body.urgency,
          source: 'website_form'
        }),
        formatDateForDB(new Date())
      ]
    )

    console.log('Contact sauvegardé en DB:', {
      id: contactId,
      type: body.type,
      customer: body.customer.email,
      subject: body.subject
    })

    // Envoyer notification email à l'équipe NS2PO
    const notificationData = {
      reference: contactId,
      customerName: `${body.customer.firstName} ${body.customer.lastName}`,
      customerEmail: body.customer.email,
      type: body.type as 'quote' | 'preorder' | 'custom' | 'support' | 'meeting',
      subject: body.subject,
      message: body.message,
      orderDetails: body.orderDetails // Ajouter les détails de commande pour les devis
    }
    
    try {
      await sendOrderNotification(notificationData)
      await sendCustomerConfirmation(notificationData)
      console.log('✅ Emails envoyés avec succès pour contact:', contactId)
    } catch (emailError) {
      console.error('⚠️ Erreur envoi emails pour contact:', contactId, emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    // Générer l'URL de tracking
    const config = useRuntimeConfig()
    const baseUrl = config.public.siteUrl || 'https://election.ns2po.ci'
    const trackingUrl = `${baseUrl}/suivi/${contactId}`

    const response: ContactSubmissionResponse = {
      success: true,
      contactId,
      reference: contactId, // Ajouter reference pour compatibilité useEmailQuote
      trackingUrl, // Ajouter trackingUrl pour le composable
      message: body.type === 'quote'
        ? 'Votre demande de devis a été envoyée avec succès!'
        : 'Votre message a été envoyé avec succès!',
      nextSteps: body.type === 'quote'
        ? [
          'Nous étudierons votre demande de devis dans les plus brefs délais',
          'Vous recevrez une confirmation par email avec votre référence',
          'Notre équipe commerciale vous contactera sous 24h pour finaliser votre devis'
        ]
        : [
          'Nous traiterons votre demande dans les plus brefs délais',
          'Vous recevrez une confirmation par email',
          'Un membre de notre équipe vous contactera sous 24h'
        ],
      estimatedResponseTime: body.type === 'quote' ? '24 heures' : '24 heures'
    }

    return {
      success: true,
      reference: contactId,
      trackingUrl,
      message: response.message,
      data: response
    }

  } catch (error: any) {
    console.error('Erreur soumission contact:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de l\'envoi du message'
    })
  }
})