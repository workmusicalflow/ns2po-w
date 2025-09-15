/**
 * Service de gestion des instructions de paiement commercial
 */

import { TursoClient, generateId, formatDateForDB, stringifyForDB, parseDBJson, type QueryOptions } from '../client'

export interface DBPaymentInstruction {
  id: string
  order_id: string
  instruction_type: 'mobile_money' | 'bank_transfer' | 'cash' | 'commercial_contact'
  contact_person?: string
  instructions: string // JSON
  due_date?: string
  amount: number
  currency: string
  reference: string
  status: 'sent' | 'confirmed' | 'completed' | 'expired'
  created_at: string
  updated_at: string
}

export interface DBCommercialContact {
  id: string
  name: string
  role: 'sales' | 'manager' | 'support'
  mobile_phone: string
  fixed_phone?: string
  email?: string
  specialties: string // JSON array
  availability_hours: string // JSON
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentInstructionData {
  mobile: string
  fixe?: string
  email?: string
  montant: number
  reference: string
  delai_jours: number
  instructions: string[]
  horaires: string
  contact_urgence?: string
}

export class PaymentInstructionsService {
  constructor(private db: TursoClient) {}

  /**
   * Créer des instructions de paiement pour une commande
   */
  async createForOrder(
    orderId: string, 
    amount: number, 
    instructionType: DBPaymentInstruction['instruction_type'] = 'commercial_contact'
  ): Promise<DBPaymentInstruction> {
    const id = generateId('PAY_INST')
    const reference = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const now = formatDateForDB()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7) // 7 jours pour payer

    // Récupérer les contacts commerciaux actifs
    const contacts = await this.getActiveCommercialContacts()
    const primaryContact = contacts.find(c => c.role === 'sales') || contacts[0]

    // Générer les instructions selon le type
    const instructions = await this.generateInstructions(instructionType, amount, reference, primaryContact)

    const paymentInstruction: Omit<DBPaymentInstruction, 'updated_at'> = {
      id,
      order_id: orderId,
      instruction_type: instructionType,
      contact_person: primaryContact?.id,
      instructions: stringifyForDB(instructions),
      due_date: formatDateForDB(dueDate),
      amount,
      currency: 'XOF',
      reference,
      status: 'sent',
      created_at: now
    }

    const result = await this.db.execute(
      `INSERT INTO payment_instructions (
        id, order_id, instruction_type, contact_person, instructions,
        due_date, amount, currency, reference, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentInstruction.id, paymentInstruction.order_id, paymentInstruction.instruction_type,
        paymentInstruction.contact_person, paymentInstruction.instructions, paymentInstruction.due_date,
        paymentInstruction.amount, paymentInstruction.currency, paymentInstruction.reference,
        paymentInstruction.status, paymentInstruction.created_at
      ]
    )

    if (result.rowsAffected === 0) {
      throw new Error('Failed to create payment instructions')
    }

    return { ...paymentInstruction, updated_at: now }
  }

  /**
   * Récupérer les instructions pour une commande
   */
  async getByOrderId(orderId: string): Promise<DBPaymentInstruction | null> {
    const result = await this.db.execute(
      'SELECT * FROM payment_instructions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToPaymentInstruction(result.rows[0])
  }

  /**
   * Mettre à jour le statut des instructions
   */
  async updateStatus(id: string, status: DBPaymentInstruction['status']): Promise<boolean> {
    const result = await this.db.execute(
      'UPDATE payment_instructions SET status = ? WHERE id = ?',
      [status, id]
    )

    return result.rowsAffected > 0
  }

  /**
   * Récupérer les contacts commerciaux actifs
   */
  async getActiveCommercialContacts(): Promise<DBCommercialContact[]> {
    const result = await this.db.execute(
      'SELECT * FROM commercial_contacts WHERE is_active = TRUE ORDER BY role, name'
    )

    return result.rows.map(row => this.mapRowToCommercialContact(row))
  }

  /**
   * Générer les instructions selon le type de paiement
   */
  private async generateInstructions(
    type: DBPaymentInstruction['instruction_type'],
    amount: number,
    reference: string,
    contact?: DBCommercialContact
  ): Promise<PaymentInstructionData> {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-CI', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }

    const baseData: PaymentInstructionData = {
      mobile: contact?.mobile_phone || '+2250575129737',
      fixe: contact?.fixed_phone || '+2252721248803',
      email: contact?.email || 'commercial@ns2po.ci',
      montant: amount,
      reference,
      delai_jours: 7,
      instructions: [],
      horaires: 'Lundi-Vendredi: 8h-17h, Samedi: 8h-12h'
    }

    switch (type) {
      case 'commercial_contact':
        baseData.instructions = [
          '📞 Contactez notre service commercial pour organiser le paiement :',
          '',
          `📱 Mobile : ${baseData.mobile}`,
          `☎️ Fixe : ${baseData.fixe}`,
          `✉️ Email : ${baseData.email}`,
          '',
          `💰 Montant : ${formatCurrency(amount)}`,
          `📋 Référence : ${reference}`,
          '',
          '⏰ Horaires d\'ouverture :',
          baseData.horaires,
          '',
          '🚨 Pour les urgences : appelez le mobile 24h/7j',
          '',
          '💳 Modes de paiement acceptés :',
          '• Mobile Money (Orange, MTN, Moov)',
          '• Virement bancaire',
          '• Espèces en agence',
          '• Chèque (entreprises uniquement)',
          '',
          '✅ Notre commercial vous guidera pour choisir la meilleure option'
        ]
        break

      case 'mobile_money':
        baseData.instructions = [
          '📱 Paiement par Mobile Money',
          '',
          `💰 Montant : ${formatCurrency(amount)}`,
          `📋 Référence : ${reference}`,
          '',
          '📞 Contactez-nous pour les détails :',
          `Mobile : ${baseData.mobile}`,
          '',
          '💡 Opérateurs acceptés :',
          '• Orange Money',
          '• MTN Money', 
          '• Moov Money',
          '',
          '⚠️ Conservez votre reçu de transaction'
        ]
        break

      case 'bank_transfer':
        baseData.instructions = [
          '🏦 Paiement par virement bancaire',
          '',
          '📊 Coordonnées bancaires :',
          'Banque : UBA Côte d\'Ivoire',
          'Titulaire : NS2PO SARL',
          'IBAN : CI05 CI123 45678 90123456789 01',
          '',
          `💰 Montant : ${formatCurrency(amount)}`,
          `📋 Référence obligatoire : ${reference}`,
          '',
          '📞 Confirmation requise :',
          `Appelez le ${baseData.mobile} après virement`,
          '',
          '📄 Envoyez le reçu par email ou WhatsApp'
        ]
        break

      case 'cash':
        baseData.instructions = [
          '💵 Paiement en espèces',
          '',
          '📍 Adresse de nos bureaux :',
          'Zone 4, Rue K55',
          'Marcory - Abidjan',
          'Côte d\'Ivoire',
          '',
          `💰 Montant : ${formatCurrency(amount)}`,
          `📋 Référence : ${reference}`,
          '',
          '⏰ Horaires d\'ouverture :',
          baseData.horaires,
          '',
          '🅿️ Parking disponible sur place',
          '🧾 Reçu officiel fourni',
          '',
          '📞 Prévenez de votre venue :',
          `${baseData.mobile}`
        ]
        break
    }

    return baseData
  }

  /**
   * Convertir une ligne DB en PaymentInstruction
   */
  private mapRowToPaymentInstruction(row: any): DBPaymentInstruction {
    return {
      id: row.id,
      order_id: row.order_id,
      instruction_type: row.instruction_type,
      contact_person: row.contact_person,
      instructions: row.instructions,
      due_date: row.due_date,
      amount: Number(row.amount),
      currency: row.currency,
      reference: row.reference,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  /**
   * Convertir une ligne DB en CommercialContact
   */
  private mapRowToCommercialContact(row: any): DBCommercialContact {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      mobile_phone: row.mobile_phone,
      fixed_phone: row.fixed_phone,
      email: row.email,
      specialties: row.specialties,
      availability_hours: row.availability_hours,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}