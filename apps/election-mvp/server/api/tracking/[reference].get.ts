/**
 * API Route pour récupérer les informations de suivi d'une commande
 */

import type { CustomerInfo, OrderTrackingInfo, TrackingTimelineEvent } from '@ns2po/types'
import { createTursoClient, OrdersService, CustomersService, isValidTrackingReference, parseTrackingReference } from '@ns2po/database'

export default defineEventHandler(async (event) => {
  try {
    const reference = getRouterParam(event, 'reference')

    if (!reference) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Référence de suivi manquante'
      })
    }

    // Valider la référence
    if (!isValidTrackingReference(reference)) {
      return {
        success: false,
        trackingReference: reference,
        error: 'Référence de suivi invalide'
      } as OrderTrackingInfo
    }

    // Connecter à la base de données
    const db = createTursoClient()
    const ordersService = new OrdersService(db)
    const customersService = new CustomersService(db)

    // Chercher la commande par référence de suivi
    // Note: Dans notre implémentation actuelle, nous utilisons la référence comme ID de commande
    const order = await ordersService.findById(reference)

    if (!order) {
      return {
        success: false,
        trackingReference: reference,
        error: 'Aucune commande trouvée avec cette référence'
      } as OrderTrackingInfo
    }

    // Récupérer les informations du client
    const customer = await customersService.findById(order.customer_id)

    if (!customer) {
      return {
        success: false,
        trackingReference: reference,
        error: 'Informations client introuvables'
      } as OrderTrackingInfo
    }

    // Générer la timeline de suivi
    const timeline = generateOrderTimeline(order)

    // Formater la réponse
    const trackingInfo: OrderTrackingInfo = {
      success: true,
      trackingReference: reference,
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.payment_status,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        estimatedDeliveryDate: order.estimated_delivery_date,
        actualDeliveryDate: order.actual_delivery_date,
        notes: order.notes
      },
      customer: {
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone
      },
      timeline
    }

    return trackingInfo

  } catch (error: any) {
    console.error('Erreur récupération suivi:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de la récupération des informations de suivi'
    })
  }
})

/**
 * Génère la timeline de suivi basée sur le statut de la commande
 */
function generateOrderTimeline(order: any): TrackingTimelineEvent[] {
  const events: TrackingTimelineEvent[] = []
  const createdDate = new Date(order.created_at)

  // Événement de création de commande
  events.push({
    date: createdDate.toLocaleDateString('fr-FR'),
    title: 'Commande reçue',
    description: 'Votre pré-commande a été enregistrée avec succès',
    status: 'completed',
    icon: '📋'
  })

  // Événements basés sur le statut de paiement
  if (order.payment_status === 'paid') {
    events.push({
      date: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      title: 'Paiement confirmé',
      description: 'Votre acompte a été reçu et confirmé',
      status: 'completed',
      icon: '💰'
    })
  } else {
    events.push({
      date: 'En attente',
      title: 'Paiement en attente',
      description: 'En attente du versement de l\'acompte',
      status: 'current',
      icon: '⏳'
    })
  }

  // Événements basés sur le statut de la commande
  switch (order.status) {
    case 'pending_payment':
      // Pas d'événements supplémentaires
      break
      
    case 'paid':
    case 'processing':
      if (order.payment_status === 'paid') {
        events.push({
          date: new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          title: 'Commande en traitement',
          description: 'Préparation des fichiers de production',
          status: 'current',
          icon: '⚙️'
        })
      }
      break
      
    case 'production':
      events.push({
        date: new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        title: 'Production en cours',
        description: 'Vos articles sont en cours de fabrication',
        status: 'current',
        icon: '🏭'
      })
      break
      
    case 'shipping':
      events.push({
        date: new Date(createdDate.getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        title: 'Expédition',
        description: 'Vos articles ont été expédiés',
        status: 'current',
        icon: '🚚'
      })
      break
      
    case 'delivered':
      events.push({
        date: order.actual_delivery_date 
          ? new Date(order.actual_delivery_date).toLocaleDateString('fr-FR')
          : new Date(createdDate.getTime() + 12 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        title: 'Livré',
        description: 'Votre commande a été livrée avec succès',
        status: 'completed',
        icon: '✅'
      })
      break
      
    case 'cancelled':
      events.push({
        date: new Date().toLocaleDateString('fr-FR'),
        title: 'Commande annulée',
        description: 'Cette commande a été annulée',
        status: 'completed',
        icon: '❌'
      })
      break
  }

  // Ajouter événements futurs si pas encore livrés
  if (order.status !== 'delivered' && order.status !== 'cancelled') {
    const futureEvents = getFutureEvents(order, events.length)
    events.push(...futureEvents)
  }

  return events
}

/**
 * Génère les événements futurs prévus
 */
function getFutureEvents(order: any, currentEventCount: number): TrackingTimelineEvent[] {
  const events: TrackingTimelineEvent[] = []
  const createdDate = new Date(order.created_at)

  // Si pas encore en production
  if (order.status === 'pending_payment' || order.status === 'paid' || order.status === 'processing') {
    events.push({
      date: 'Prévue',
      title: 'Production',
      description: 'Fabrication de vos articles personnalisés',
      status: 'pending',
      icon: '🏭'
    })
  }

  // Si pas encore expédié
  if (order.status !== 'shipping' && order.status !== 'delivered') {
    events.push({
      date: 'Prévue',
      title: 'Expédition',
      description: 'Envoi de votre commande',
      status: 'pending',
      icon: '🚚'
    })
  }

  // Si pas encore livré
  if (order.status !== 'delivered') {
    const estimatedDate = order.estimated_delivery_date 
      ? new Date(order.estimated_delivery_date).toLocaleDateString('fr-FR')
      : 'À confirmer'
    
    events.push({
      date: estimatedDate,
      title: 'Livraison prévue',
      description: 'Réception de votre commande',
      status: 'pending',
      icon: '📦'
    })
  }

  return events
}