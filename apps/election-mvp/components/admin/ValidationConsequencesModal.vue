<template>
  <AdminModal
    :show="show"
    title="Conséquences de la suppression"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Product being removed -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500" />
          <div>
            <h3 class="text-sm font-medium text-blue-800">Produit à supprimer</h3>
            <p class="text-sm text-blue-700">{{ productName }}</p>
          </div>
        </div>
      </div>

      <!-- Violations list -->
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800 mb-3">
              Cette action rendra le bundle invalide
            </h3>
            <ul class="space-y-2">
              <li v-for="violation in violations" :key="violation.type" class="flex items-start space-x-2">
                <span class="text-red-500 mt-1">•</span>
                <div class="text-sm text-red-700">
                  <span class="font-medium">{{ violation.label }}:</span>
                  <span class="ml-1">{{ violation.message }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Before/After comparison - Quantité uniquement -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-800 mb-2">Avant suppression</h4>
          <div class="space-y-1 text-xs text-gray-600">
            <div class="flex justify-between">
              <span>Quantité:</span>
              <span class="font-medium">{{ beforeState.quantity }} articles</span>
            </div>
          </div>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-red-800 mb-2">Après suppression</h4>
          <div class="space-y-1 text-xs text-red-600">
            <div class="flex justify-between">
              <span>Quantité:</span>
              <span class="font-medium">{{ afterState.quantity }} articles</span>
            </div>
            <div v-if="afterState.quantity < 1000" class="mt-2 text-xs text-red-700">
              <span class="font-medium">⚠️ Minimum requis: 1000 articles</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Impact explanation -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <Icon name="heroicons:light-bulb" class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div class="text-sm text-yellow-800">
            <p class="font-medium mb-1">Impact sur le bundle</p>
            <p>Le bundle ne pourra plus être sauvegardé tant que la quantité minimale ne sera pas atteinte. Vous devrez :</p>
            <ul class="mt-2 space-y-1 ml-4">
              <li class="list-disc">Ajouter d'autres produits pour atteindre 1000 articles minimum</li>
              <li class="list-disc">Ou augmenter les quantités des produits existants</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <div class="flex space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            @click="$emit('confirm', false)"
          >
            Supprimer quand même
          </button>
        </div>
      </div>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
interface Violation {
  type: string
  label: string
  message: string
}

interface State {
  total: number
  quantity: number
}

interface Props {
  show: boolean
  productName: string
  violations: Violation[]
  beforeState: State
  afterState: State
}

defineProps<Props>()

defineEmits<{
  close: []
  cancel: []
  confirm: [forceDelete: boolean]
}>()

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}
</script>