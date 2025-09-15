/**
 * API Route pour soumettre une demande de rendez-vous
 */

import type { MeetingRequestFormData } from '@ns2po/types'
import { sendOrderNotification, sendCustomerConfirmation } from '../../../server/utils/email'
import { saveMeetingRequest } from '../../../server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as MeetingRequestFormData

    // Validation côté serveur
    if (!body.customer?.email || !body.purpose?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Informations de rendez-vous incomplètes'
      })
    }

    if (!body.preferredDates || body.preferredDates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Au moins une date doit être proposée'
      })
    }

    // Génération d'un ID unique
    const meetingId = `MEET_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Sauvegarder en base de données
    const meetingData = {
      id: meetingId,
      customer: body.customer,
      meetingType: body.meetingType,
      preferredDate: body.preferredDates[0], // Premier créneau proposé
      preferredTime: body.preferredTimes?.[0],
      message: body.purpose,
      participants: body.customer?.company ? 2 : 1 // Estimation du nombre de participants
    }

    console.log('Demande de rendez-vous reçue:', {
      id: meetingId,
      customer: body.customer.email,
      meetingType: body.meetingType,
      dates: body.preferredDates
    })

    // Sauvegarder en base
    try {
      await saveMeetingRequest(meetingData)
      console.log('✅ Demande de rendez-vous sauvegardée en base de données:', meetingId)
    } catch (dbError) {
      console.error('⚠️ Erreur sauvegarde base de données:', dbError)
      // Ne pas faire échouer la requête si la base de données n'est pas disponible
    }

    // Formatage des créneaux proposés
    const formattedSlots = body.preferredDates.map((date, index) => {
      const dateObj = new Date(date)
      const timeSlot = body.preferredTimes?.[index] || 'À déterminer'
      return `${dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} - ${getTimeSlotLabel(timeSlot)}`
    })

    // Envoyer notification email à l'équipe NS2PO et confirmation au client
    const notificationData = {
      reference: meetingId,
      customerName: `${body.customer.firstName} ${body.customer.lastName}`,
      customerEmail: body.customer.email,
      type: 'meeting' as const,
      subject: `Demande de rendez-vous - ${body.purpose}`,
      message: `Type: ${body.meetingType}\nObjectif: ${body.purpose}\n\nCréneaux proposés:\n${formattedSlots.join('\n')}`
    }
    
    try {
      await sendOrderNotification(notificationData)
      await sendCustomerConfirmation(notificationData)
      console.log('✅ Emails envoyés avec succès pour demande RDV:', meetingId)
    } catch (emailError) {
      console.error('⚠️ Erreur envoi emails pour demande RDV:', meetingId, emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    return {
      success: true,
      data: {
        meetingId,
        message: 'Votre demande de rendez-vous a été enregistrée!',
        proposedSlots: formattedSlots,
        nextSteps: [
          'Nous étudions vos créneaux proposés',
          'Vous recevrez une confirmation sous 24h',
          'Le lieu et les détails seront précisés',
          'Un rappel vous sera envoyé avant le RDV'
        ],
        estimatedResponseTime: '24 heures',
        contactInfo: {
          email: 'rdv@ns2po.ci',
          phone: '+225 07 XX XX XX XX',
          whatsapp: '+225 07 XX XX XX XX'
        },
        cancellationPolicy: 'Annulation possible jusqu\'à 24h avant le rendez-vous'
      }
    }

  } catch (error: any) {
    console.error('Erreur demande rendez-vous:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de l\'enregistrement de la demande'
    })
  }
})

/**
 * Convertit un créneau en label lisible
 */
function getTimeSlotLabel(timeSlot: string): string {
  const labels = {
    'morning': 'Matinée (8h-12h)',
    'afternoon': 'Après-midi (14h-17h)',
    'evening': 'Soirée (17h-19h)'
  }
  
  return labels[timeSlot as keyof typeof labels] || timeSlot
}