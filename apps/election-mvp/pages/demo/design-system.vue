<template>
  <div class="min-h-screen bg-background p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-heading font-bold text-accent mb-4">
              NS2PO Design System
            </h1>
            <p class="text-xl font-body text-text-main">
              Système de design basé sur l'identité visuelle NS2PO avec Tailwind CSS et HeadlessUI
            </p>
          </div>
          
          <!-- Theme Switcher -->
          <div class="flex flex-col items-end gap-3">
            <NSThemeSwitcher />
            <div class="text-sm text-text-secondary">
              Testez les différents thèmes
            </div>
          </div>
        </div>
      </div>

      <!-- Theme Showcase -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Thèmes Disponibles
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NSCard 
            v-for="themeOption in availableThemes" 
            :key="themeOption.value"
            variant="bordered"
            class="cursor-pointer transition-all hover:shadow-lg"
            @click="switchToTheme(themeOption.value)"
          >
            <div class="text-center">
              <div class="flex justify-center gap-2 mb-3">
                <div 
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  :style="{ backgroundColor: getThemeColors(themeOption.value).primary }"
                />
                <div 
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  :style="{ backgroundColor: getThemeColors(themeOption.value).accent }"
                />
              </div>
              <h3 class="font-heading font-semibold text-text-main mb-2">
                {{ themeOption.name }}
              </h3>
              <p class="text-sm text-text-secondary">
                {{ getThemeDescription(themeOption.value) }}
              </p>
              <div 
                v-if="currentTheme === themeOption.value"
                class="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Actuel
              </div>
            </div>
          </NSCard>
        </div>
      </section>

      <!-- Color Palette -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Palette de Couleurs - {{ currentThemeName }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <ColorSwatch 
            color="primary" 
            name="Primaire (Ocre/Or)" 
            class="bg-primary" 
          />
          <ColorSwatch 
            color="accent" 
            name="Accent (Bourgogne)" 
            class="bg-accent" 
          />
          <ColorSwatch 
            color="background" 
            name="Fond Neutre" 
            class="bg-background border border-text-main/20" 
          />
          <ColorSwatch 
            color="text-main" 
            name="Texte Principal" 
            class="bg-text-main" 
          />
          <ColorSwatch 
            color="safety" 
            name="Sécurité (Jaune)" 
            class="bg-safety" 
          />
          <ColorSwatch 
            color="success" 
            name="Succès" 
            class="bg-success" 
          />
          <ColorSwatch 
            color="error" 
            name="Erreur" 
            class="bg-error" 
          />
          <ColorSwatch 
            color="warning" 
            name="Avertissement" 
            class="bg-warning" 
          />
          <ColorSwatch 
            color="info" 
            name="Information" 
            class="bg-info" 
          />
        </div>
      </section>

      <!-- Theme Testing Section -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Tests Automatisés des Thèmes
        </h2>
        <div class="space-y-6">
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              Validation de la Cohérence des Thèmes
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="text-sm space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="themeValidation.colors ? 'bg-success' : 'bg-error'" />
                  <span>Couleurs cohérentes : {{ themeValidation.colors ? '✓' : '✗' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="themeValidation.contrast ? 'bg-success' : 'bg-error'" />
                  <span>Contraste accessible : {{ themeValidation.contrast ? '✓' : '✗' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="themeValidation.transitions ? 'bg-success' : 'bg-error'" />
                  <span>Transitions fluides : {{ themeValidation.transitions ? '✓' : '✗' }}</span>
                </div>
              </div>
              <div class="text-sm space-y-2">
                <p class="font-medium text-text-main">
                  Thème actuel : {{ currentThemeName }}
                </p>
                <p class="text-text-secondary">
                  Mode sombre : {{ isDarkTheme ? 'Activé' : 'Désactivé' }}
                </p>
                <p class="text-text-secondary">
                  Thème électoral : {{ isElectionTheme ? 'Activé' : 'Désactivé' }}
                </p>
              </div>
            </div>
            
            <!-- Theme Test Controls -->
            <div class="mt-6 pt-4 border-t border-text-main/10">
              <h4 class="text-sm font-medium text-text-main mb-3">
                Tests Rapides
              </h4>
              <div class="flex flex-wrap gap-2">
                <NSButton 
                  v-for="theme in availableThemes" 
                  :key="theme.value"
                  size="sm" 
                  variant="outline"
                  class="text-xs"
                  @click="testThemeTransition(theme.value)"
                >
                  Test {{ theme.name }}
                </NSButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Typographie
        </h2>
        <div class="space-y-6">
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              Police des Titres (Poppins)
            </h3>
            <div class="space-y-2">
              <p class="text-4xl font-heading font-bold text-accent">
                Heading 1 - Bold
              </p>
              <p class="text-3xl font-heading font-semibold text-text-main">
                Heading 2 - Semibold
              </p>
              <p class="text-2xl font-heading font-medium text-text-main">
                Heading 3 - Medium
              </p>
              <p class="text-xl font-heading font-normal text-text-main">
                Heading 4 - Normal
              </p>
            </div>
          </div>
          
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              Police du Corps (Inter)
            </h3>
            <div class="space-y-2 max-w-2xl">
              <p class="text-lg font-body text-text-main">
                Texte large - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              </p>
              <p class="text-base font-body text-text-main">
                Texte normal - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco.
              </p>
              <p class="text-sm font-body text-text-main/80">
                Texte petit - Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Buttons -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Boutons
        </h2>
        <div class="space-y-8">
          <!-- Button Variants -->
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              Variants
            </h3>
            <div class="flex flex-wrap gap-4">
              <NSButton variant="primary">
                Primary
              </NSButton>
              <NSButton variant="secondary">
                Secondary
              </NSButton>
              <NSButton variant="accent">
                Accent
              </NSButton>
              <NSButton variant="outline">
                Outline
              </NSButton>
              <NSButton variant="danger">
                Danger
              </NSButton>
              <NSButton variant="ghost">
                Ghost
              </NSButton>
            </div>
          </div>

          <!-- Button Sizes -->
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              Tailles
            </h3>
            <div class="flex items-center gap-4">
              <NSButton size="sm">
                Small
              </NSButton>
              <NSButton size="md">
                Medium
              </NSButton>
              <NSButton size="lg">
                Large
              </NSButton>
            </div>
          </div>

          <!-- Button States -->
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              États
            </h3>
            <div class="flex flex-wrap gap-4">
              <NSButton>Normal</NSButton>
              <NSButton loading>
                Loading
              </NSButton>
              <NSButton disabled>
                Disabled
              </NSButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Cartes
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NSCard variant="default">
            <h3 class="text-lg font-heading font-semibold text-text-main mb-2">
              Carte par défaut
            </h3>
            <p class="font-body text-text-main/80">
              Contenu de la carte avec ombre légère et bordure.
            </p>
          </NSCard>

          <NSCard variant="elevated">
            <template #header>
              <h3 class="text-lg font-heading font-semibold text-text-main">
                Carte élevée
              </h3>
            </template>
            <p class="font-body text-text-main/80">
              Contenu principal de la carte.
            </p>
            <template #footer>
              <NSButton size="sm" variant="primary">
                Action
              </NSButton>
            </template>
          </NSCard>

          <NSCard variant="bordered" padding="lg">
            <h3 class="text-lg font-heading font-semibold text-text-main mb-2">
              Carte avec bordure
            </h3>
            <p class="font-body text-text-main/80">
              Plus d'espacement avec padding large.
            </p>
          </NSCard>
        </div>
      </section>

      <!-- Form Elements -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Éléments de Formulaire
        </h2>
        <NSCard class="max-w-md">
          <form class="space-y-6">
            <NSInput
              v-model="formData.name"
              label="Nom complet"
              placeholder="Entrez votre nom"
              required
            />
            
            <NSInput
              v-model="formData.email"
              type="email"
              label="Email"
              placeholder="exemple@email.com"
              required
            />
            
            <NSInput
              v-model="formData.phone"
              type="tel"
              label="Téléphone"
              placeholder="+225 XX XX XX XX"
              helper-text="Format international recommandé"
            />
            
            <NSInput
              v-model="formData.company"
              label="Entreprise"
              placeholder="Nom de votre entreprise"
              :error-message="formErrors.company"
            />
            
            <div class="flex gap-3">
              <NSButton variant="primary" type="submit">
                Soumettre
              </NSButton>
              <NSButton variant="ghost" type="reset">
                Réinitialiser
              </NSButton>
            </div>
          </form>
        </NSCard>
      </section>

      <!-- Menus -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Menus Dropdown
        </h2>
        <div class="flex gap-4">
          <NSMenu position="left">
            <template #trigger="{ open }">
              <NSButton variant="outline">
                Menu Actions
                <svg class="ml-2 h-4 w-4 transition-transform" :class="{ 'rotate-180': open }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </NSButton>
            </template>
            
            <NSMenuItem @click="handleMenuAction('edit')">
              Modifier
            </NSMenuItem>
            <NSMenuItem @click="handleMenuAction('duplicate')">
              Dupliquer
            </NSMenuItem>
            <NSMenuItem class="text-error" @click="handleMenuAction('delete')">
              Supprimer
            </NSMenuItem>
          </NSMenu>
        </div>
      </section>

      <!-- Modal Demo -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Modales
        </h2>
        <div class="flex gap-4">
          <NSButton variant="primary" @click="showModal = true">
            Ouvrir Modal
          </NSButton>
        </div>

        <NSModal 
          :is-open="showModal" 
          title="Exemple de Modal"
          size="md"
          @close="showModal = false"
        >
          <div class="space-y-4">
            <p class="font-body text-text-main">
              Ceci est un exemple de modal utilisant HeadlessUI avec les couleurs NS2PO.
            </p>
            <p class="font-body text-text-main/80">
              Les modales peuvent contenir tout type de contenu et s'adaptent automatiquement.
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <NSButton variant="ghost" @click="showModal = false">
                Annuler
              </NSButton>
              <NSButton variant="primary" @click="showModal = false">
                Confirmer
              </NSButton>
            </div>
          </template>
        </NSModal>
      </section>

      <!-- Advanced Component Theme Testing -->
      <section class="mb-16">
        <h2 class="text-2xl font-heading font-semibold text-text-main mb-6">
          Test Avancé : Composant Électoral
        </h2>
        <div class="space-y-6">
          <div class="p-6 bg-surface rounded-lg border border-text-main/10">
            <h3 class="text-lg font-heading font-medium text-text-main mb-4">
              NSElectionProductCard - Test du Système de Thème
            </h3>
            <p class="text-sm text-text-secondary mb-6">
              Ce composant démontre l'adaptation automatique selon le thème actuel.
              Les badges, couleurs et messages changent dynamiquement.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Product Card Normal -->
              <NSElectionProductCard 
                :product="testProduct" 
                @add-to-quote="handleAddToQuote" 
                @preview="handlePreview"
              />
              
              <!-- Product Card Featured -->
              <NSElectionProductCard 
                :product="testProduct" 
                :featured="true"
                @add-to-quote="handleAddToQuote" 
                @preview="handlePreview"
              />
            </div>
            
            <div class="mt-6 p-4 bg-background rounded border border-text-main/10">
              <h4 class="text-sm font-medium text-text-main mb-2">
                État du Thème
              </h4>
              <div class="text-xs text-text-secondary space-y-1">
                <p>🎨 Thème actuel : <span class="text-accent font-medium">{{ currentThemeName }}</span></p>
                <p>🌙 Mode sombre : <span class="text-accent font-medium">{{ isDarkTheme ? 'Activé' : 'Désactivé' }}</span></p>
                <p>🏛️ Contexte électoral : <span class="text-accent font-medium">{{ isElectionTheme ? 'Activé' : 'Désactivé' }}</span></p>
                <p>🎯 Badge affiché : <span class="text-accent font-medium">{{ isElectionTheme ? '🏛️ Campagne' : '⭐ Vedette' }}</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTheme } from '~/composables/useTheme'
import { useThemeAware } from '~/composables/useThemeAware'
import type { ThemeVariant } from '~/composables/useTheme'

// Import des composants
import NSButton from '~/components/ui/NSButton.vue'
import NSCard from '~/components/ui/NSCard.vue'
import NSInput from '~/components/ui/NSInput.vue'
import NSMenu from '~/components/ui/NSMenu.vue'
import NSMenuItem from '~/components/ui/NSMenuItem.vue'
import NSModal from '~/components/ui/NSModal.vue'
import NSThemeSwitcher from '~/components/ui/NSThemeSwitcher.vue'
import NSElectionProductCard from '~/components/ui/NSElectionProductCard.vue'

// Gestion des thèmes
const { 
  currentTheme, 
  theme, 
  setTheme, 
  getThemesList,
  saveThemeToStorage 
} = useTheme()

const {
  isElectionTheme,
  isDarkTheme,
  themeClasses,
  contextualColors
} = useThemeAware()

const availableThemes = computed(() => getThemesList())
const currentThemeName = computed(() => theme.value.name)

// Données de formulaire
const formData = ref({
  name: '',
  email: '',
  phone: '',
  company: ''
})

const formErrors = ref({
  company: ''
})

// État des modales
const showModal = ref(false)

// Données de test pour NSElectionProductCard
const testProduct = ref({
  id: 'test-product-1',
  name: 'T-Shirt Personnalisé Premium',
  description: 'T-shirt en coton bio 100% avec impression haute qualité. Parfait pour les campagnes électorales et événements promotionnels.',
  category: 'Textile',
  unitPrice: 12500,
  minQuantity: 50,
  image: '',
  volumeDiscount: {
    threshold: 500,
    percentage: 15
  }
})

// Actions des menus
const handleMenuAction = (action: string) => {
  console.log(`Action: ${action}`)
}

// Handlers pour NSElectionProductCard
const handleAddToQuote = (data: { product: any; quantity: number }) => {
  console.log('🛒 Ajout au devis:', {
    product: data.product.name,
    quantity: data.quantity,
    theme: currentTheme.value,
    isElectionContext: isElectionTheme.value
  })
  
  // Simulation d'ajout avec feedback visuel
  alert(`✅ "${data.product.name}" (x${data.quantity}) ajouté au devis!\n🎨 Thème: ${currentThemeName.value}`)
}

const handlePreview = (product: any) => {
  console.log('👀 Prévisualisation:', {
    product: product.name,
    theme: currentTheme.value,
    isDark: isDarkTheme.value
  })
  
  // Simulation de prévisualisation avec contexte thématique
  alert(`🔍 Prévisualisation de "${product.name}"\n🎨 Thème: ${currentThemeName.value}\n${isElectionTheme.value ? '🏛️' : '⭐'} Contexte: ${isElectionTheme.value ? 'Électoral' : 'Standard'}`)
}

// ===== FONCTIONNALITÉS DE TEST DES THÈMES =====

// Validation automatique des thèmes
const themeValidation = computed(() => {
  const colors = validateThemeColors()
  const contrast = validateContrast()
  const transitions = validateTransitions()
  
  return {
    colors,
    contrast,
    transitions,
    overall: colors && contrast && transitions
  }
})

// Validation des couleurs de thème
const validateThemeColors = (): boolean => {
  try {
    const requiredColors = ['primary', 'accent', 'background', 'surface', 'textMain', 'textSecondary']
    return requiredColors.every(color => {
      const colorValue = theme.value.colors[color as keyof typeof theme.value.colors]
      return colorValue && typeof colorValue === 'string' && colorValue.startsWith('#')
    })
  } catch {
    return false
  }
}

// Validation du contraste d'accessibilité
const validateContrast = (): boolean => {
  try {
    // Simulation basique de test de contraste
    // En production, on utiliserait une vraie librairie de contraste
    const textColor = theme.value.colors.textMain
    const bgColor = theme.value.colors.background
    
    // Test simple : couleurs différentes
    return textColor !== bgColor
  } catch {
    return false
  }
}

// Validation des transitions
const validateTransitions = (): boolean => {
  try {
    // Vérification que les classes CSS de transition sont présentes
    const element = document.querySelector('.theme-transition')
    return element !== null
  } catch {
    return false
  }
}

// Test de transition rapide entre thèmes
const testThemeTransition = async (targetTheme: ThemeVariant) => {
  const originalTheme = currentTheme.value
  
  // Appliquer le nouveau thème
  setTheme(targetTheme)
  await nextTick()
  
  // Attendre pour voir la transition
  setTimeout(() => {
    // Retourner au thème original après 2 secondes
    setTheme(originalTheme)
    saveThemeToStorage()
  }, 2000)
}

// Gestion des thèmes
const switchToTheme = (newTheme: ThemeVariant) => {
  setTheme(newTheme)
  saveThemeToStorage()
}

const getThemeColors = (themeValue: ThemeVariant) => {
  const themeColors = {
    'default': { primary: '#D4AF37', accent: '#8B2635' },
    'election-primary': { primary: '#1E40AF', accent: '#DC2626' },
    'election-secondary': { primary: '#059669', accent: '#7C3AED' },
    'dark': { primary: '#FCD34D', accent: '#F87171' }
  }
  return themeColors[themeValue] || themeColors.default
}

const getThemeDescription = (themeValue: ThemeVariant) => {
  const descriptions = {
    'default': 'Identité NS2PO classique avec or et bourgogne',
    'election-primary': 'Couleurs institutionnelles pour campagnes officielles',
    'election-secondary': 'Alternative moderne avec vert et violet',
    'dark': 'Mode sombre pour utilisation nocturne'
  }
  return descriptions[themeValue] || descriptions.default
}

// Composant ColorSwatch
const ColorSwatch = defineComponent({
  props: {
    color: String,
    name: String,
    class: String
  },
  template: `
    <div class="text-center">
      <div :class="['w-full h-20 rounded-md mb-2', class]"></div>
      <p class="text-sm font-body font-medium text-text-main">{{ name }}</p>
      <p class="text-xs font-body text-text-main/60">{{ color }}</p>
    </div>
  `
})

// SEO
useHead({
  title: 'Design System - NS2PO',
  meta: [
    { name: 'description', content: 'Système de design NS2PO avec Tailwind CSS et HeadlessUI' }
  ]
})
</script>