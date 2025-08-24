import { initializeTheme } from '~/composables/useTheme'

export default defineNuxtPlugin(() => {
  // Initialisation du système de thème côté client
  initializeTheme()
})