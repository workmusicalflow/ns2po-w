/**
 * API Route pour soumettre une pré-commande
 */

import type { PreorderFormData, PreorderSubmissionResponse } from '@ns2po/types'

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

    // Génération d'un ID unique et référence de paiement
    const preorderId = `PRE_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const paymentReference = `PAY_${preorderId.split('_')[1]}`

    // Calcul des montants
    const totalAmount = body.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const depositAmount = Math.round(totalAmount * 0.5) // 50% d'acompte
    const remainingAmount = totalAmount - depositAmount

    // TODO: Sauvegarder en base de données (Turso)
    const preorderData = {
      id: preorderId,
      ...body,
      totalAmount,
      depositAmount,
      remainingAmount,
      paymentReference,
      status: 'submitted' as const,
      createdAt: new Date().toISOString()
    }

    console.log('Pré-commande reçue:', {
      id: preorderId,
      customer: body.customer.email,
      itemsCount: body.items.length,
      totalAmount,
      paymentMethod: body.paymentMethod
    })

    // TODO: Sauvegarder en base
    // await savePreorder(preorderData)

    // TODO: Envoyer confirmation par email
    // await sendPreorderConfirmation(preorderData)

    // Génération des instructions de paiement
    const paymentInstructions = generatePaymentInstructions(
      body.paymentMethod,
      depositAmount,
      paymentReference
    )

    // Calcul de la livraison estimée
    const estimatedDelivery = calculateEstimatedDelivery(
      body.timeline?.estimatedProduction || 7
    )

    const response: PreorderSubmissionResponse = {
      success: true,
      preorderId,
      message: 'Votre pré-commande a été enregistrée avec succès!',
      paymentInstructions,
      nextSteps: [
        'Effectuez le versement de l\'acompte dans les 7 jours',
        'Nous confirmerons votre commande après réception du paiement',
        'La production démarrera dès confirmation',
        'Vous serez informé(e) des étapes de production'
      ],
      estimatedDelivery
    }

    return {
      success: true,
      data: {
        ...response,
        paymentReference
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
      instructions: [] as string[]
    }
  }

  switch (method) {
    case 'bank_transfer':
      baseInstructions.details = {
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