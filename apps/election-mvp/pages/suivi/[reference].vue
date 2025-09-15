<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Suivi de commande
            </h1>
            <p class="text-gray-600 mt-1">
              Référence: {{ reference }}
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="text-blue-600 hover:text-blue-700 font-medium">
              ← Retour à l'accueil
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Chargement -->
      <div v-if="pending" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p class="mt-2 text-gray-600">
          Récupération des informations...
        </p>
      </div>

      <!-- Erreur -->
      <div
        v-else-if="error || (trackingData && !trackingData.success)" 
        class="bg-red-50 border border-red-200 rounded-lg p-6"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="text-2xl">❌</span>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-red-800">
              {{ error?.message || trackingData?.error || 'Erreur de chargement' }}
            </h3>
            <p class="mt-2 text-red-700">
              Veuillez vérifier votre référence de suivi ou contactez notre service client.
            </p>
            <div class="mt-4">
              <a
                href="mailto:commercial@ns2po.ci" 
                class="text-red-600 hover:text-red-700 font-medium"
              >
                📧 commercial@ns2po.ci
              </a>
              <span class="mx-2 text-red-400">|</span>
              <a
                href="tel:+2250575129737" 
                class="text-red-600 hover:text-red-700 font-medium"
              >
                📞 +225 05 75 12 97 37
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations de suivi -->
      <div v-else-if="trackingData && trackingData.success" class="space-y-6">
        <!-- Résumé de la commande -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">
              Informations de la commande
            </h2>
            <StatusBadge :status="trackingData.order?.status" />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium text-gray-900 mb-2">
                Client
              </h3>
              <p class="text-gray-600">
                {{ trackingData.customer?.firstName }} {{ trackingData.customer?.lastName }}
              </p>
              <p class="text-gray-600">
                {{ trackingData.customer?.email }}
              </p>
              <p v-if="trackingData.customer?.phone" class="text-gray-600">
                {{ trackingData.customer?.phone }}
              </p>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 mb-2">
                Détails de la commande
              </h3>
              <p class="text-gray-600">
                <span class="font-medium">Montant total:</span> 
                {{ formatCurrency(trackingData.order?.totalAmount || 0) }}
              </p>
              <p class="text-gray-600">
                <span class="font-medium">Date de commande:</span> 
                {{ formatDate(trackingData.order?.createdAt) }}
              </p>
              <p v-if="trackingData.order?.estimatedDeliveryDate" class="text-gray-600">
                <span class="font-medium">Livraison prévue:</span> 
                {{ formatDate(trackingData.order?.estimatedDeliveryDate) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Articles commandés -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Articles commandés
          </h3>
          <div class="space-y-4">
            <div
              v-for="(item, index) in getTypedItems(trackingData.order?.items || [])" 
              :key="index" 
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 class="font-medium text-gray-900">
                  {{ item.productName }}
                </h4>
                <p class="text-gray-600">
                  Quantité: {{ item.quantity }}
                </p>
                <p v-if="item.customizations?.length" class="text-sm text-gray-500">
                  Personnalisations: {{ item.customizations.join(', ') }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-900">
                  {{ formatCurrency(item.totalPrice) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatCurrency(item.unitPrice) }} / unité
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline de suivi -->
        <TrackingTimeline 
          v-if="trackingData.timeline"
          :events="trackingData.timeline" 
        />

        <!-- Statut de paiement -->
        <div
          v-if="trackingData.order?.paymentStatus !== 'paid'" 
          class="bg-amber-50 border border-amber-200 rounded-lg p-6"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-2xl">⏳</span>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-amber-800">
                Paiement en attente
              </h3>
              <p class="mt-2 text-amber-700">
                Votre acompte n'a pas encore été confirmé. Contactez notre service commercial pour finaliser le paiement.
              </p>
              <div class="mt-4 space-y-2">
                <div class="flex items-center space-x-4">
                  <a
                    href="tel:+2250575129737" 
                    class="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    📞 +225 05 75 12 97 37
                  </a>
                  <a
                    href="tel:+2252721248803" 
                    class="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    📞 +225 27 21 24 88 03
                  </a>
                </div>
                <p class="text-sm text-amber-600">
                  Heures d'ouverture: Lundi-Vendredi 8h-17h, Samedi 8h-12h
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes additionnelles -->
        <div v-if="trackingData.order?.notes" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="font-medium text-blue-900 mb-2">
            Notes
          </h3>
          <p class="text-blue-800">
            {{ trackingData.order.notes }}
          </p>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Besoin d'aide ?
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="mailto:commercial@ns2po.ci" 
              class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span class="mr-2">📧</span>
              Envoyer un email
            </a>
            <NuxtLink
              to="/contact" 
              class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span class="mr-2">💬</span>
              Nous contacter
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderTrackingInfo, OrderTrackingItem } from '@ns2po/types'

// Récupérer la référence depuis l'URL
const route = useRoute()
const reference = computed(() => route.params.reference as string)

// Configuration des métadonnées de la page
useHead({
  title: `Suivi de commande - ${reference.value}`,
  meta: [
    { name: 'description', content: `Suivez votre commande NS2PO avec la référence ${reference.value}` }
  ]
})

// Récupération des données de suivi
const { data: trackingData, pending, error } = await useFetch<OrderTrackingInfo>(`/api/tracking/${reference.value}`)

// Helper pour typer les items correctement
const getTypedItems = (items: unknown[]): OrderTrackingItem[] => {
  return items as OrderTrackingItem[]
}

// Utilitaires de formatage
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Non définie'
  
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>