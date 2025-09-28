<template>
  <footer
    :class="[
      'sticky-bottom-bar fixed inset-x-0 bottom-0 z-50',
      'bg-white/95 backdrop-blur-sm border-t border-gray-200',
      'px-4 py-3',
      'transition-transform duration-300',
      isVisible ? 'translate-y-0' : 'translate-y-full'
    ]"
    :style="{
      paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)`
    }"
  >
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between gap-4">
        <!-- Section gauche: Total et détails -->
        <div class="flex-1">
          <div class="flex items-baseline gap-2">
            <span class="text-xs text-gray-500">Total</span>
            <span v-if="itemCount > 0" class="text-xs text-gray-500">
              ({{ itemCount }} {{ itemCount === 1 ? 'article' : 'articles' }})
            </span>
          </div>
          <div class="text-xl md:text-2xl font-bold text-accent">
            {{ formatPrice(total) }}
          </div>
        </div>

        <!-- Section droite: CTA Principal -->
        <button
          @click="handleAction"
          :disabled="isDisabled"
          :class="[
            'cta-button flex items-center justify-center gap-2',
            'min-h-[48px] px-6 md:px-8 py-3',
            'bg-primary text-white font-bold rounded-lg',
            'transition-all duration-200',
            'hover:bg-primary-dark hover:shadow-lg',
            'active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[140px] md:min-w-[180px]'
          ]"
        >
          <!-- Loading state -->
          <svg
            v-if="loading"
            class="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          <!-- Label du bouton -->
          <span>{{ buttonLabel }}</span>

          <!-- Icône flèche -->
          <svg
            v-if="!loading"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <!-- Barre de progression optionnelle -->
      <div v-if="showProgress" class="mt-3">
        <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Étape {{ currentStep }} sur {{ totalSteps }}</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div
            class="bg-primary h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  total: number
  itemCount?: number
  buttonLabel: string
  loading?: boolean
  isDisabled?: boolean
  isVisible?: boolean
  showProgress?: boolean
  currentStep?: number
  totalSteps?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemCount: 0,
  loading: false,
  isDisabled: false,
  isVisible: true,
  showProgress: false,
  currentStep: 1,
  totalSteps: 3
})

// Emits
const emit = defineEmits<{
  action: []
}>()

// Computed
const progressPercent = computed(() => {
  if (!props.showProgress || props.totalSteps === 0) return 0
  return Math.round((props.currentStep / props.totalSteps) * 100)
})

// Methods
const handleAction = () => {
  if (!props.isDisabled && !props.loading) {
    emit('action')
  }
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>

<style scoped>
.sticky-bottom-bar {
  /* Ombre subtile vers le haut */
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

.cta-button {
  /* Optimisations tactiles */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* Support du notch iOS */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .sticky-bottom-bar {
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
  }
}

/* Animation du bouton au tap mobile */
@media (hover: none) {
  .cta-button:active {
    transform: scale(0.95);
  }
}

/* Ajustements pour très petits écrans */
@media (max-width: 360px) {
  .sticky-bottom-bar {
    padding-left: 12px;
    padding-right: 12px;
  }

  .cta-button {
    min-width: 120px;
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>