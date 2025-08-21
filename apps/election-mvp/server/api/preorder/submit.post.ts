/**
 * API Route pour soumettre une pré-commande
 */

import type { PreorderFormData, PreorderSubmissionResponse } from '@ns2po/types'
import { createTursoClient, CustomersService, OrdersService, PaymentInstructionsService, generateId, formatDateForDB, stringifyForDB, generateTrackingReference, generateTrackingUrl } from '@ns2po/database'

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
        addressLine1: body.customer.address?.line1,
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
 * Génère les instructions de paiement selon la méthode
 */
function generatePaymentInstructions(method: string, amount: number, reference: string) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const baseInstructions = {
    method,
    amount,
    reference,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    details: {
      instructions: [] as string[],
      bankAccount: undefined as string | undefined,
      mobileMoneyNumber: undefined as string | undefined
    }
  }

  switch (method) {
    case 'bank_transfer':
      baseInstructions.details = {
        ...baseInstructions.details,
        bankAccount: 'CI05 CI123 45678 90123456789 01',
        instructions: [
          'Effectuez un virement bancaire sur notre compte :',
          'Banque: UBA Côte d\'Ivoire',
          'Titulaire: NS2PO SARL',
          'Compte: CI05 CI123 45678 90123456789 01',
          'Référence obligatoire: ' + reference,
          'Montant exact: ' + formatCurrency(amount),
          'Envoyez le reçu par email ou WhatsApp'
        ]
      }
      break
    
    case 'mobile_money':
      baseInstructions.details = {
        ...baseInstructions.details,
        mobileMoneyNumber: '+225 07 XX XX XX XX',
        instructions: [
          'Envoyez le montant via Mobile Money :',
          'Numéro marchand: +225 07 XX XX XX XX',
          'Nom: NS2PO',
          'Montant exact: ' + formatCurrency(amount),
          'Référence: ' + reference,
          'Opérateurs acceptés: Orange Money, MTN Money, Moov Money',
          'Conservez le SMS de confirmation et envoyez-nous une capture'
        ]
      }
      break
    
    case 'cash':
      baseInstructions.details = {
        ...baseInstructions.details,
        instructions: [
          'Apportez le montant en espèces à nos bureaux :',
          'Adresse: Zone 4, Rue K55, Marcory - Abidjan',
          'Heures d\'ouverture: Lundi-Vendredi 8h-17h, Samedi 8h-12h',
          'Référence à mentionner: ' + reference,
          'Montant exact: ' + formatCurrency(amount),
          'Demandez un reçu officiel',
          'Parking disponible sur place'
        ]
      }
      break
    
    default:
      baseInstructions.details.instructions = [
        'Contactez-nous pour les instructions de paiement',
        'Email: contact@ns2po.ci',
        'Téléphone: +225 07 XX XX XX XX',
        'Référence: ' + reference
      ]
  }

  return baseInstructions
}

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