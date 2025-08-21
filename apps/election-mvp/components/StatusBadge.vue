<template>
  <span :class="badgeClasses">
    <span class="mr-1">{{ statusIcon }}</span>
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  status: 'pending_payment'
})

const statusConfig = computed(() => {
  switch (props.status) {
    case 'pending_payment':
      return {
        label: 'En attente de paiement',
        icon: '⏳',
        classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    case 'paid':
      return {
        label: 'Payé',
        icon: '💰',
        classes: 'bg-green-100 text-green-800 border-green-200'
      }
    case 'processing':
      return {
        label: 'En traitement',
        icon: '⚙️',
        classes: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    case 'production':
      return {
        label: 'En production',
        icon: '🏭',
        classes: 'bg-purple-100 text-purple-800 border-purple-200'
      }
    case 'shipping':
      return {
        label: 'Expédié',
        icon: '🚚',
        classes: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      }
    case 'delivered':
      return {
        label: 'Livré',
        icon: '✅',
        classes: 'bg-green-100 text-green-800 border-green-200'
      }
    case 'cancelled':
      return {
        label: 'Annulé',
        icon: '❌',
        classes: 'bg-red-100 text-red-800 border-red-200'
      }
    default:
      return {
        label: 'Statut inconnu',
        icon: '❓',
        classes: 'bg-gray-100 text-gray-800 border-gray-200'
      }
  }
})

const statusLabel = computed(() => statusConfig.value.label)
const statusIcon = computed(() => statusConfig.value.icon)
const badgeClasses = computed(() => 
  `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.value.classes}`
)
</script>