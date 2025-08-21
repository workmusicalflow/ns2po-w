/**
 * API Route pour soumettre une demande de rendez-vous
 */

import type { MeetingRequestFormData } from '@ns2po/types'

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
    const meetingId = `MEET_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // TODO: Sauvegarder en base de données (Turso)
    const meetingData = {
      id: meetingId,
      ...body,
      status: 'requested' as const,
      createdAt: new Date().toISOString()
    }

    console.log('Demande de rendez-vous reçue:', {
      id: meetingId,
      customer: body.customer.email,
      meetingType: body.meetingType,
      dates: body.preferredDates
    })

    // TODO: Sauvegarder en base
    // await saveMeetingRequest(meetingData)

    // TODO: Notification équipe commerciale
    // await notifySalesTeam(meetingData)

    // TODO: Auto-répondeur client
    // await sendMeetingRequestConfirmation(meetingData)

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