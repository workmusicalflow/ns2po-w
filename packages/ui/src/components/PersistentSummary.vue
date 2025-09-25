<!--
  PersistentSummary.vue
  Récapitulatif persistent de la sélection actuelle
  Reste visible pendant toute la navigation pour maintenir le contexte utilisateur
-->

<template>
  <!-- Container principal avec positionnement collant -->
  <div
    :class="[
      'bg-white border-t shadow-lg transition-all duration-300 ease-in-out',
      compact ? 'py-3' : 'py-4',
      isMinimized ? 'transform translate-y-0' : '',
      position === 'bottom'
        ? 'sticky bottom-0 z-40'
        : 'fixed bottom-0 left-0 right-0 z-40',
    ]"
  >
    <!-- Barre de progression minimisée -->
    <div
      v-if="isMinimized"
      @click="toggleMinimized"
      class="px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span class="font-medium text-gray-800">
            {{ selectionSummary?.name || "Sélection en cours" }}
          </span>
          <span class="text-sm text-gray-600">
            ({{ selectionSummary?.totalItems || 0 }} articles)
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="font-bold text-primary">
            {{ formatPrice(selectionSummary?.totalPrice || 0) }}
          </div>
          <svg
            class="w-5 h-5 text-gray-400 transform rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Contenu complet du récapitulatif -->
    <div v-else class="px-4 space-y-4">
      <!-- En-tête avec bouton réduire -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              selectionSummary ? 'bg-green-500' : 'bg-gray-300',
            ]"
          ></div>
          <h3 class="font-heading font-semibold text-gray-900">
            Récapitulatif de votre sélection
          </h3>
        </div>
        <button
          @click="toggleMinimized"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            class="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <!-- Message si aucune sélection -->
      <div
        v-if="!selectionSummary || selectionSummary.totalItems === 0"
        class="text-center py-4 text-gray-500"
      >
        <div class="flex items-center justify-center gap-2 mb-2">
          <svg
            class="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span class="text-sm font-medium">Aucune sélection active</span>
        </div>
        <p class="text-xs text-gray-400">
          Choisissez un pack ou ajoutez des produits pour commencer
        </p>
      </div>

      <!-- Résumé de sélection -->
      <div v-else class="space-y-3">
        <!-- Informations principales -->
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  selectionSummary.type === 'bundle'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent',
                ]"
              >
                {{
                  selectionSummary.type === "bundle"
                    ? "Pack sélectionné"
                    : "Sélection personnalisée"
                }}
              </span>
              <span
                v-if="isCustomized"
                class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
              >
                Modifié
              </span>
            </div>
            <h4 class="font-semibold text-gray-900 mt-1 truncate">
              {{ selectionSummary.name }}
            </h4>
          </div>
          <div class="text-right ml-4">
            <div class="text-lg font-bold text-primary">
              {{ formatPrice(selectionSummary.totalPrice) }}
            </div>
            <div
              v-if="selectionSummary.savings && selectionSummary.savings > 0"
              class="text-xs text-green-600 font-medium"
            >
              Économie: {{ formatPrice(selectionSummary.savings) }}
            </div>
          </div>
        </div>

        <!-- Détails rapides -->
        <div class="flex items-center justify-between text-sm text-gray-600">
          <div class="flex items-center gap-4">
            <span>{{ selectionSummary.totalItems }} article(s)</span>
            <span v-if="estimatedDeliveryDays" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              {{ estimatedDeliveryDays }} jours
            </span>
          </div>
          <button
            v-if="showQuickActions"
            @click="toggleQuickActions"
            class="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {{ quickActionsOpen ? "Masquer" : "Actions" }}
          </button>
        </div>

        <!-- Actions rapides (optionnelles) -->
        <div
          v-if="quickActionsOpen"
          class="flex items-center gap-2 pt-2 border-t"
        >
          <button
            @click="emitAction('modify')"
            class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Modifier
          </button>
          <button
            @click="emitAction('duplicate')"
            class="px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
          >
            Dupliquer
          </button>
          <button
            @click="emitAction('quote')"
            class="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Devis
          </button>
        </div>

        <!-- Indicateur de progression -->
        <div v-if="showProgress" class="space-y-2">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Progression du devis</span>
            <span>{{ Math.round(progressPercentage) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from "vue";
import type { ComputedRef, Ref } from "vue";
import type { MultiSelectionState } from "@ns2po/types";

// =====================================
// PROPS & EMITS
// =====================================

interface Props {
  // Affichage
  compact?: boolean;
  position?: "fixed" | "sticky" | "bottom";
  showQuickActions?: boolean;
  showProgress?: boolean;

  // Comportement
  autoMinimize?: boolean;
  persistState?: boolean;

  // Style
  theme?: "light" | "dark";
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  position: "bottom",
  showQuickActions: true,
  showProgress: true,
  autoMinimize: false,
  persistState: true,
  theme: "light",
});

const emit = defineEmits<{
  action: [action: "modify" | "duplicate" | "quote" | "clear"];
  minimized: [minimized: boolean];
  "progress-updated": [percentage: number];
}>();

// =====================================
// REACTIVE STATE
// =====================================

const isMinimized = ref(props.autoMinimize);
const quickActionsOpen = ref(false);

// =====================================
// DEPENDENCY INJECTION
// =====================================

// Injecté depuis le composant parent (page devis)
const selectionSummary = inject<ComputedRef<any>>("selectionSummary");
const multiSelectionState = inject<Ref<MultiSelectionState>>(
  "multiSelectionState",
);
const currentCart = inject<ComputedRef<any>>("currentCart");

// =====================================
// COMPUTED PROPERTIES
// =====================================

// Détermine si la sélection a été modifiée
const isCustomized = computed(() => {
  return currentCart?.value?.isCustomized || false;
});

// Estime les jours de livraison basés sur la sélection
const estimatedDeliveryDays = computed(() => {
  if (!selectionSummary?.value) return null;

  // Logique d'estimation basée sur le type et la complexité
  const totalItems = selectionSummary.value.totalItems || 0;

  if (totalItems <= 5) return 3;
  if (totalItems <= 20) return 5;
  if (totalItems <= 50) return 7;
  return 10;
});

// Calcule le pourcentage de progression du devis
const progressPercentage = computed(() => {
  if (!selectionSummary?.value) return 0;

  const steps = [
    selectionSummary.value.totalItems > 0, // Sélection produits
    selectionSummary.value.totalPrice > 0, // Calcul prix
    true, // Toujours true pour cette étape (récapitulatif)
    false, // Devis généré (sera true plus tard)
  ];

  const completedSteps = steps.filter(Boolean).length;
  return (completedSteps / steps.length) * 100;
});

// =====================================
// METHODS
// =====================================

/**
 * Formatage du prix en XOF
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Toggle l'état minimisé
 */
const toggleMinimized = () => {
  isMinimized.value = !isMinimized.value;
  emit("minimized", isMinimized.value);
};

/**
 * Toggle les actions rapides
 */
const toggleQuickActions = () => {
  quickActionsOpen.value = !quickActionsOpen.value;
};

/**
 * Émet une action vers le composant parent
 */
const emitAction = (action: "modify" | "duplicate" | "quote" | "clear") => {
  emit("action", action);

  // Log pour le développement
  console.log(`🎯 Action PersistentSummary: ${action}`);
};

// =====================================
// LIFECYCLE
// =====================================

// Auto-minimiser après un délai si configuré
if (props.autoMinimize) {
  setTimeout(() => {
    if (selectionSummary?.value?.totalItems > 0) {
      isMinimized.value = true;
    }
  }, 3000);
}
</script>

<style scoped>
/* Animation pour le slide up/down */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-in-out;
}

.slide-enter-from {
  transform: translateY(100%);
}

.slide-leave-to {
  transform: translateY(100%);
}

/* Animation pour la barre de progression */
.progress-bar {
  background: linear-gradient(
    90deg,
    theme("colors.primary") 0%,
    theme("colors.accent") 100%
  );
}

/* Style pour les états interactifs */
.summary-container:hover {
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* Animation du point de statut */
@keyframes pulse-status {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-pulse {
  animation: pulse-status 2s infinite;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .summary-mobile {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .summary-mobile .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .summary-mobile .action-buttons button {
    width: 100%;
  }
}

/* Dark theme support */
.dark .summary-container {
  background-color: theme("colors.gray.800");
  border-color: theme("colors.gray.700");
  color: theme("colors.gray.100");
}

.dark .minimized-bar:hover {
  background-color: theme("colors.gray.700");
}
</style>
