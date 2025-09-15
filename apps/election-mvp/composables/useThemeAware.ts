import { computed } from 'vue'
import { useTheme } from './useTheme'

/**
 * Composable pour des composants conscients du thème
 * Fournit des utilitaires pour adapter le comportement selon le thème actuel
 */
export const useThemeAware = () => {
  const { currentTheme, theme, colorScheme } = useTheme()

  // Détection du contexte électoral
  const isElectionTheme = computed(() => 
    currentTheme.value === 'election-primary' || currentTheme.value === 'election-secondary'
  )

  const isDarkTheme = computed(() => 
    currentTheme.value === 'dark' || colorScheme.value === 'dark'
  )

  const isLightTheme = computed(() => !isDarkTheme.value)

  // Classes CSS adaptatives selon le thème
  const themeClasses = computed(() => ({
    background: isDarkTheme.value 
      ? 'bg-background text-text-main' 
      : 'bg-background text-text-main',
    card: isDarkTheme.value 
      ? 'bg-surface border-text-main/20' 
      : 'bg-surface border-text-main/10',
    interactive: isDarkTheme.value 
      ? 'hover:bg-text-main/10' 
      : 'hover:bg-primary/5',
    text: {
      primary: 'text-text-main',
      secondary: 'text-text-secondary',
      accent: 'text-accent',
      brand: 'text-primary'
    },
    border: isDarkTheme.value 
      ? 'border-text-main/30' 
      : 'border-text-main/20'
  }))

  // Couleurs optimisées pour le contexte
  const contextualColors = computed(() => {
    const base = theme.value.colors

    return {
      ...base,
      // Couleurs contextuelles pour les éléments UI
      cardBackground: isDarkTheme.value ? base.surface : '#FFFFFF',
      inputBackground: isDarkTheme.value ? base.surface : base.background,
      overlayBackground: isDarkTheme.value 
        ? 'rgba(0, 0, 0, 0.8)' 
        : 'rgba(0, 0, 0, 0.5)',
      
      // Couleurs de focus adaptées au contraste
      focusRing: isElectionTheme.value ? base.accent : base.primary,
      
      // Couleurs d'état avec bon contraste
      successBackground: isDarkTheme.value 
        ? 'rgba(52, 211, 153, 0.1)' 
        : 'rgba(16, 185, 129, 0.1)',
      errorBackground: isDarkTheme.value 
        ? 'rgba(248, 113, 113, 0.1)' 
        : 'rgba(239, 68, 68, 0.1)',
      warningBackground: isDarkTheme.value 
        ? 'rgba(251, 191, 36, 0.1)' 
        : 'rgba(245, 158, 11, 0.1)'
    }
  })

  // Styles inline pour les éléments dynamiques
  const themeStyles = computed(() => ({
    '--theme-primary': theme.value.colors.primary,
    '--theme-accent': theme.value.colors.accent,
    '--theme-background': theme.value.colors.background,
    '--theme-surface': theme.value.colors.surface,
    '--theme-text-main': theme.value.colors.textMain,
    '--theme-text-secondary': theme.value.colors.textSecondary,
    '--theme-card-bg': contextualColors.value.cardBackground,
    '--theme-overlay-bg': contextualColors.value.overlayBackground
  }))

  // Getters pour les couleurs spécifiques
  const getPrimaryColor = () => theme.value.colors.primary
  const getAccentColor = () => theme.value.colors.accent
  const getTextColor = (variant: 'main' | 'secondary' = 'main') => 
    variant === 'main' ? theme.value.colors.textMain : theme.value.colors.textSecondary

  // Utilitaires pour l'accessibilité
  const getContrastingColor = (backgroundColor: string) => {
    // Fonction simplifiée pour déterminer si utiliser du texte clair ou foncé
    // Basée sur la luminosité perçue de la couleur de fond
    const isDark = ['#0F172A', '#1E293B', '#14532D'].includes(backgroundColor) || 
                   isDarkTheme.value
    return isDark ? '#F8FAFC' : '#1F2937'
  }

  // Classes pour l'animation de transition entre thèmes
  const transitionClasses = 'transition-colors duration-200 ease-in-out'

  return {
    // État
    currentTheme,
    theme,
    isElectionTheme,
    isDarkTheme,
    isLightTheme,

    // Styles et classes
    themeClasses,
    contextualColors,
    themeStyles,
    transitionClasses,

    // Utilitaires
    getPrimaryColor,
    getAccentColor,
    getTextColor,
    getContrastingColor
  }
}