/**
 * Composable pour la gestion de la base de données Turso
 */

import { createTursoClient, CustomersService, OrdersService, PaymentInstructionsService } from '@ns2po/database'
import type { 
  TursoClient, 
  CreateCustomerData, 
  CreateOrderData, 
  QueryOptions
} from '@ns2po/database'
import type { 
  CustomerType, 
  PreorderStatus, 
  PaymentStatus 
} from '@ns2po/types'

// Singleton pour la connexion DB
let dbClient: TursoClient | null = null

export const useDatabase = () => {
  // Initialiser le client si pas encore fait
  if (!dbClient) {
    const config = useRuntimeConfig()
    
    if (!config.tursoUrl) {
      throw new Error('TURSO_DATABASE_URL is required in runtime config')
    }
    
    dbClient = createTursoClient()
  }

  // Services métier
  const customers = new CustomersService(dbClient)
  const orders = new OrdersService(dbClient)
  const paymentInstructions = new PaymentInstructionsService(dbClient)

  return {
    // Client brut pour requêtes personnalisées
    client: dbClient,
    
    // Services métier
    customers,
    orders,
    paymentInstructions,
    
    // Utilitaires
    async ping() {
      return await dbClient!.ping()
    },
    
    async close() {
      if (dbClient) {
        await dbClient.close()
        dbClient = null
      }
    }
  }
}

/**
 * Composable pour la gestion des clients
 */
export const useCustomers = () => {
  const { customers } = useDatabase()
  
  return {
    async createCustomer(data: CreateCustomerData) {
      return await customers.create(data)
    },
    
    async findCustomerByEmail(email: string) {
      return await customers.findByEmail(email)
    },
    
    async findCustomerById(id: string) {
      return await customers.findById(id)
    },
    
    async listCustomers(options?: QueryOptions & { customerType?: CustomerType; isVerified?: boolean; search?: string }) {
      return await customers.list(options)
    },
    
    async updateCustomer(id: string, data: Partial<CreateCustomerData>) {
      return await customers.update(id, data)
    }
  }
}

/**
 * Composable pour la gestion des commandes
 */
export const useOrders = () => {
  const { orders } = useDatabase()
  
  return {
    async createOrder(data: CreateOrderData) {
      return await orders.create(data)
    },
    
    async findOrderById(id: string) {
      return await orders.findById(id)
    },
    
    async listOrders(options?: QueryOptions & { customerId?: string; status?: PreorderStatus; paymentStatus?: PaymentStatus; dateFrom?: Date; dateTo?: Date }) {
      return await orders.list(options)
    },
    
    async updateOrderStatus(id: string, status: PreorderStatus, notes?: string) {
      return await orders.updateStatus(id, status, notes)
    },
    
    async updatePaymentStatus(id: string, status: PaymentStatus, reference?: string) {
      return await orders.updatePaymentStatus(id, status, reference)
    },
    
    async getOrderStats(dateFrom?: Date, dateTo?: Date) {
      return await orders.getStats(dateFrom, dateTo)
    }
  }
}

/**
 * Composable pour les instructions de paiement
 */
export const usePaymentInstructions = () => {
  const { paymentInstructions } = useDatabase()
  
  return {
    async createInstructionsForOrder(orderId: string, amount: number, type?: 'bank_transfer' | 'mobile_money' | 'cash' | 'commercial_contact') {
      return await paymentInstructions.createForOrder(orderId, amount, type)
    },
    
    async getInstructionsByOrderId(orderId: string) {
      return await paymentInstructions.getByOrderId(orderId)
    },
    
    async updateInstructionsStatus(id: string, status: 'expired' | 'confirmed' | 'completed' | 'sent') {
      return await paymentInstructions.updateStatus(id, status)
    },
    
    async getCommercialContacts() {
      return await paymentInstructions.getActiveCommercialContacts()
    }
  }
}