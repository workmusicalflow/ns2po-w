<!--
  MutationButton Component
  Reusable button with loading state for TanStack Query mutations

  Pattern validé par la communauté Vue 3 + TanStack Query (2025)
  Sources: TanStack docs, Flowbite, Medium, GitHub open-source

  Features:
  - Loading spinner avec svg-spinners:ring-resize
  - Disabled state pendant mutation (empêche double-click)
  - ARIA compliant (aria-busy, sr-only)
  - Tailwind CSS only (zéro CSS custom)
  - TypeScript strict compatible
-->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** État pending de la mutation TanStack Query */
  isPending: boolean
  /** Texte du bouton (état normal) */
  text: string
  /** Texte affiché pendant loading (défaut: "Chargement...") */
  loadingText?: string
  /** Nom de l'icône spinner Nuxt Icon (défaut: svg-spinners:ring-resize) */
  spinnerIcon?: string
  /** Classes Tailwind pour l'icône (défaut: w-4 h-4) */
  iconClass?: string
  /** Classes Tailwind supplémentaires pour le bouton */
  buttonClass?: string
  /** Type HTML du bouton */
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: 'Chargement...',
  spinnerIcon: 'svg-spinners:ring-resize',
  iconClass: 'w-4 h-4',
  type: 'button',
})

const currentText = computed(() => props.isPending ? props.loadingText : props.text)
</script>

<template>
  <button
    :type="type"
    :disabled="isPending"
    :aria-busy="isPending ? 'true' : 'false'"
    :class="[
      'inline-flex items-center justify-center gap-2',
      'transition-opacity duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      buttonClass,
    ]"
  >
    <template v-if="isPending">
      <Icon :name="spinnerIcon" :class="iconClass" aria-hidden="true" />
      <span class="sr-only">{{ loadingText }}</span>
      <!-- Texte visible pour utilisateurs voyants -->
      <span aria-hidden="true">{{ loadingText }}</span>
    </template>
    <template v-else>
      <!-- Slot pour contenu custom, sinon utilise prop text -->
      <slot>{{ text }}</slot>
    </template>
  </button>
</template>

<style scoped>
/* Pas de CSS custom - tout géré par Tailwind */
</style>
