/**
 * Types pour le suivi des commandes
 */

export interface OrderTrackingInfo {
  success: boolean
  trackingReference: string
  order?: {
    id: string
    status: string
    paymentStatus: string
    items: any[]
    totalAmount: number
    createdAt: string
    estimatedDeliveryDate?: string
    actualDeliveryDate?: string
    notes?: string
  }
  customer?: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  timeline?: TrackingTimelineEvent[]
  error?: string
}

export interface TrackingTimelineEvent {
  date: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending'
  icon: string
}