<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusClasses
    ]"
  >
    {{ text }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  status: string
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: ''
})

const statusClasses = computed(() => {
  const status = props.status.toLowerCase()
  
  switch (status) {
    case 'pending':
    case 'en_attente':
      return 'bg-yellow-100 text-yellow-800'
    case 'processing':
    case 'en_cours':
      return 'bg-blue-100 text-blue-800'
    case 'shipped':
    case 'expedie':
      return 'bg-purple-100 text-purple-800'
    case 'delivered':
    case 'livre':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
    case 'annule':
      return 'bg-red-100 text-red-800'
    case 'paid':
    case 'paye':
      return 'bg-green-100 text-green-800'
    case 'unpaid':
    case 'non_paye':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})
</script>