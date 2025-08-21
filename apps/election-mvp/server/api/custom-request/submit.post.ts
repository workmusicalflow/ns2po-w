/**
 * API Route pour soumettre une demande personnalisée
 */

import type { CustomRequestFormData } from '@ns2po/types'
import { sendOrderNotification, sendCustomerConfirmation } from '../../../server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as CustomRequestFormData

    // Validation côté serveur
    if (!body.customer?.email || !body.description?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Informations de demande incomplètes'
      })
    }

    // Génération d'un ID unique
    const requestId = `CUSTOM_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // TODO: Sauvegarder en base de données (Turso)
    // const requestData = {
    //   id: requestId,
    //   ...body,
    //   status: 'new' as const,
    //   createdAt: new Date().toISOString()
    // }

    console.log('Demande personnalisée reçue:', {
      id: requestId,
      customer: body.customer.email,
      projectType: body.projectType,
      budget: body.budget
    })

    // TODO: Sauvegarder en base
    // await saveCustomRequest(requestData)

    // Envoyer notification email à l'équipe NS2PO et confirmation au client
    const notificationData = {
      reference: requestId,
      customerName: `${body.customer.firstName} ${body.customer.lastName}`,
      customerEmail: body.customer.email,
      type: 'custom' as const,
      subject: `Demande personnalisée - ${body.projectType}`,
      message: `Description: ${body.description}\n\nBudget indicatif: ${body.budget ? `${body.budget} FCFA` : 'Non spécifié'}\nDélai souhaité: ${body.deadline || 'Flexible'}\nFichiers joints: ${body.attachments ? body.attachments.length : 0}`
    }
    
    try {
      await sendOrderNotification(notificationData)
      await sendCustomerConfirmation(notificationData)
      console.log('✅ Emails envoyés avec succès pour demande personnalisée:', requestId)
    } catch (emailError) {
      console.error('⚠️ Erreur envoi emails pour demande personnalisée:', requestId, emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    return {
      success: true,
      data: {
        requestId,
        message: 'Votre demande personnalisée a été reçue!',
        nextSteps: [
          'Notre équipe créative étudie votre projet',
          'Vous recevrez un premier retour sous 48h',
          'Un devis détaillé vous sera proposé',
          'Nous planifierons un rendez-vous si nécessaire'
        ],
        estimatedResponseTime: '48 heures',
        contactInfo: {
          email: 'creative@ns2po.ci',
          phone: '+225 07 XX XX XX XX',
          whatsapp: '+225 07 XX XX XX XX'
        }
      }
    }

  } catch (error: any) {
    console.error('Erreur soumission demande personnalisée:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de l\'envoi de la demande'
    })
  }
})