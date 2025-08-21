/**
 * API Route pour soumettre un formulaire de contact
 */

import type { ContactFormData, ContactSubmissionResponse } from '@ns2po/types'

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
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // TODO: Sauvegarder en base de données (Turso)
    // Pour l'instant, on simule la sauvegarde
    const contactData = {
      id: contactId,
      ...body,
      status: 'new' as const,
      createdAt: new Date().toISOString()
    }

    console.log('Contact reçu:', {
      id: contactId,
      type: body.type,
      customer: body.customer.email,
      subject: body.subject
    })

    // TODO: Envoyer notification email
    // await sendContactNotification(contactData)

    // TODO: Auto-répondeur client
    // await sendAutoResponse(contactData)

    const response: ContactSubmissionResponse = {
      success: true,
      contactId,
      message: 'Votre message a été envoyé avec succès!',
      nextSteps: [
        'Nous traiterons votre demande dans les plus brefs délais',
        'Vous recevrez une confirmation par email',
        'Un membre de notre équipe vous contactera sous 24h'
      ],
      estimatedResponseTime: '24 heures'
    }

    return {
      success: true,
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