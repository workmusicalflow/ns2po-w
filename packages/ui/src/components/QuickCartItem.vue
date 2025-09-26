<template>
  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div class="flex-1">
      <div class="font-medium text-sm text-gray-900">
        {{ itemName }}
      </div>
      <div class="text-xs text-gray-500 mt-1">
        {{ formatPrice(itemPrice) }} / unité
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- Contrôles de quantité -->
      <div class="flex items-center bg-white rounded-lg border border-gray-200">
        <button
          @click="decreaseQuantity"
          :disabled="quantity <= minQuantity"
          class="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>

        <input
          type="number"
          :value="quantity"
          @input="updateQuantity"
          :min="minQuantity"
          class="w-16 text-center border-0 focus:outline-none text-sm"
        />

        <button
          @click="increaseQuantity"
          class="p-1 hover:bg-gray-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <!-- Bouton supprimer -->
      <button
        @click="$emit('remove')"
        class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- Prix total -->
    <div class="text-right ml-4 min-w-[100px]">
      <div class="font-semibold text-primary">
        {{ formatPrice(itemPrice * quantity) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  product?: any;
  selection?: any;
  bundleMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bundleMode: false
});

const emit = defineEmits<{
  'quantity-change': [quantity: number];
  'remove': [];
}>();

// Computed properties pour gérer les deux modes (bundle ou custom)
const itemName = computed(() => {
  if (props.product) return props.product.name;
  if (props.selection) return props.selection.name || 'Produit personnalisé';
  return 'Article';
});

const itemPrice = computed(() => {
  if (props.product) return props.product.basePrice || 0;
  if (props.selection) return props.selection.price || 0;
  return 0;
});

const quantity = ref(1);
const minQuantity = computed(() => {
  if (props.product) return props.product.minQuantity || 1;
  if (props.selection) return 1;
  return 1;
});

// Watchers
watch(() => props.product?.quantity, (newQuantity) => {
  if (newQuantity) quantity.value = newQuantity;
}, { immediate: true });

watch(() => props.selection?.quantity, (newQuantity) => {
  if (newQuantity) quantity.value = newQuantity;
}, { immediate: true });

// Methods
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
};

const updateQuantity = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const newQuantity = parseInt(input.value) || minQuantity.value;
  quantity.value = Math.max(newQuantity, minQuantity.value);
  emit('quantity-change', quantity.value);
};

const increaseQuantity = () => {
  quantity.value++;
  emit('quantity-change', quantity.value);
};

const decreaseQuantity = () => {
  if (quantity.value > minQuantity.value) {
    quantity.value--;
    emit('quantity-change', quantity.value);
  }
};
</script>