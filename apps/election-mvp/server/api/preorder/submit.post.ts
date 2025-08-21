/**
 * API Route pour soumettre une pré-commande
 */

import type { PreorderFormData, PreorderSubmissionResponse } from '@ns2po/types'
import { createTursoClient, CustomersService, OrdersService, PaymentInstructionsService, generateTrackingReference, generateTrackingUrl } from '@ns2po/database'
import { sendOrderNotification, sendCustomerConfirmation } from '../../../server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as PreorderFormData

    // Validation côté serveur
    if (!body.customer?.email || !body.items || body.items.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données de pré-commande incomplètes'
      })
    }

    if (!body.agreedToTerms) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Vous devez accepter les conditions générales'
      })
    }

    // Initialiser les services de base de données
    const db = createTursoClient()
    const customersService = new CustomersService(db)
    const ordersService = new OrdersService(db)
    const paymentService = new PaymentInstructionsService(db)

    // Générer une référence de suivi unique
    const trackingRef = generateTrackingReference('ORDER')
    const preorderId = trackingRef.full
    
    // Calcul des montants
    const totalAmount = body.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const depositAmount = Math.round(totalAmount * 0.5) // 50% d'acompte
    const remainingAmount = totalAmount - depositAmount

    // Créer ou trouver le client
    let customer = await customersService.findByEmail(body.customer.email)
    
    if (!customer) {
      customer = await customersService.create({
        email: body.customer.email,
        firstName: body.customer.firstName,
        lastName: body.customer.lastName,
        phone: body.customer.phone,
        company: body.customer.company,
        addressLine1: body.customer.address?.street,
        city: body.customer.address?.city,
        customerType: body.customer.customerType || 'individual'
      })
    }

    // Créer la commande avec l'ID de la référence de suivi
    const order = await ordersService.create({
      id: preorderId, // Utiliser la référence de suivi comme ID
      customerId: customer.id,
      customerData: body.customer,
      items: body.items,
      subtotal: totalAmount,
      taxAmount: 0, // Pas de TVA sur l'acompte
      totalAmount: depositAmount, // Commencer par l'acompte
      paymentMethod: body.paymentMethod,
      shippingAddress: body.deliveryInfo.address,
      estimatedDeliveryDate: body.timeline?.deliveryDate ? new Date(body.timeline.deliveryDate) : undefined,
      notes: `Pré-commande - Acompte: ${depositAmount} FCFA, Solde: ${remainingAmount} FCFA`,
      metadata: {
        preorder: true,
        depositAmount,
        remainingAmount,
        timeline: body.timeline
      }
    })

    // Créer les instructions de paiement commercial
    const paymentInstructions = await paymentService.createForOrder(
      order.id,
      depositAmount,
      'commercial_contact' // Toujours contact commercial pour MVP
    )

    console.log('Pré-commande sauvegardée:', {
      orderId: order.id,
      customer: body.customer.email,
      itemsCount: body.items.length,
      depositAmount,
      paymentMethod: 'commercial_contact'
    })

    // Calcul de la livraison estimée
    const estimatedDelivery = calculateEstimatedDelivery(
      body.timeline?.estimatedProduction || 7
    )

    // Extraire les instructions de paiement formatées
    const instructionsData = JSON.parse(paymentInstructions.instructions)
    
    // Générer l'URL de suivi
    const trackingUrl = generateTrackingUrl(preorderId)

    // Envoyer notification email à l'équipe NS2PO et confirmation au client
    const notificationData = {
      reference: preorderId,
      customerName: `${customer.first_name} ${customer.last_name}`,
      customerEmail: customer.email,
      type: 'preorder' as const,
      subject: `Pré-commande ${preorderId}`,
      message: `Nouvelle pré-commande pour ${body.items.length} article(s). Montant total: ${totalAmount} FCFA`,
      orderDetails: {
        items: body.items,
        totalAmount,
        depositAmount,
        paymentMethod: 'commercial_contact',
        estimatedDelivery
      }
    }
    
    try {
      await sendOrderNotification(notificationData)
      await sendCustomerConfirmation(notificationData)
      console.log('✅ Emails envoyés avec succès pour pré-commande:', preorderId)
    } catch (emailError) {
      console.error('⚠️ Erreur envoi emails pour pré-commande:', preorderId, emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    const response: PreorderSubmissionResponse = {
      success: true,
      preorderId: order.id,
      trackingReference: preorderId,
      trackingUrl,
      message: 'Votre pré-commande a été enregistrée avec succès!',
      paymentInstructions: {
        method: 'commercial_contact',
        amount: depositAmount,
        reference: paymentInstructions.reference,
        dueDate: paymentInstructions.due_date || '',
        details: instructionsData
      },
      nextSteps: [
        '📞 Contactez notre service commercial pour finaliser le paiement',
        '💰 Versement de l\'acompte requis (50% du montant total)',
        '✅ Confirmation de commande après réception du paiement',
        '🏭 Démarrage de la production dès confirmation',
        `📱 Suivez votre commande sur : ${trackingUrl}`
      ],
      estimatedDelivery
    }

    return {
      success: true,
      data: {
        ...response,
        orderId: order.id,
        trackingReference: preorderId,
        trackingUrl,
        paymentReference: paymentInstructions.reference,
        commercialContact: {
          mobile: '+2250575129737',
          fixe: '+2252721248803',
          email: 'commercial@ns2po.ci',
          horaires: 'Lundi-Vendredi: 8h-17h, Samedi: 8h-12h'
        }
      }
    }

  } catch (error: any) {
    console.error('Erreur soumission pré-commande:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de l\'enregistrement de la pré-commande'
    })
  }
})


/**
 * Calcule la date de livraison estimée
 */
function calculateEstimatedDelivery(productionDays: number): string {
  const processingDays = 2 // Traitement de la commande
  const deliveryBuffer = 3 // Buffer pour la livraison
  const totalDays = processingDays + productionDays + deliveryBuffer
  
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + totalDays)
  
  return deliveryDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}