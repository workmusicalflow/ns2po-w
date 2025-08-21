<template>
  <div class="product-preview">
    <!-- Configuration de personnalisation -->
    <div class="customization-panel">
      <h3 class="panel-title">Personnalisation</h3>
      
      <!-- Upload du logo -->
      <div class="customization-section">
        <label class="section-label">Logo</label>
        <CloudinaryUpload
          preset="logo"
          folder="logos"
          @upload:success="handleLogoUpload"
          @upload:error="handleUploadError"
        />
      </div>

      <!-- Texte personnalisé -->
      <div class="customization-section">
        <label class="section-label">Texte personnalisé</label>
        <input
          v-model="customization.text"
          type="text"
          placeholder="Votre texte ici..."
          class="text-input"
          maxlength="50"
        />
      </div>

      <!-- Position -->
      <div class="customization-section">
        <label class="section-label">Position</label>
        <div class="position-grid">
          <button
            v-for="position in availablePositions"
            :key="position.value"
            @click="customization.position = position.value"
            :class="[
              'position-btn',
              { 'position-btn--active': customization.position === position.value }
            ]"
          >
            <div class="position-icon">
              <component :is="position.icon" />
            </div>
            <span>{{ position.label }}</span>
          </button>
        </div>
      </div>

      <!-- Couleurs -->
      <div class="customization-section">
        <label class="section-label">Couleurs</label>
        <div class="color-grid">
          <button
            v-for="color in availableColors"
            :key="color.value"
            @click="toggleColor(color.value)"
            :class="[
              'color-btn',
              { 'color-btn--selected': customization.colors?.includes(color.value) }
            ]"
            :style="{ backgroundColor: color.hex }"
            :title="color.name"
          >
            <svg v-if="customization.colors?.includes(color.value)" class="color-check" viewBox="0 0 24 24">
              <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Prévisualisation -->
    <div class="preview-panel">
      <h3 class="panel-title">Aperçu</h3>
      
      <!-- Canvas de prévisualisation -->
      <div class="preview-container">
        <canvas
          ref="previewCanvas"
          :width="canvasWidth"
          :height="canvasHeight"
          class="preview-canvas"
        />
        
        <!-- Overlay pour afficher les détails -->
        <div class="preview-overlay">
          <div class="overlay-content">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-category">{{ product.category }}</p>
            
            <div v-if="customization.text || customization.logoUrl" class="customization-summary">
              <div v-if="customization.logoUrl" class="summary-item">
                <span class="summary-label">Logo:</span>
                <span class="summary-value">Ajouté</span>
              </div>
              <div v-if="customization.text" class="summary-item">
                <span class="summary-label">Texte:</span>
                <span class="summary-value">"{{ customization.text }}"</span>
              </div>
              <div v-if="customization.position" class="summary-item">
                <span class="summary-label">Position:</span>
                <span class="summary-value">{{ getPositionLabel(customization.position) }}</span>
              </div>
              <div v-if="customization.colors?.length" class="summary-item">
                <span class="summary-label">Couleurs:</span>
                <div class="summary-colors">
                  <div
                    v-for="color in customization.colors"
                    :key="color"
                    class="summary-color"
                    :style="{ backgroundColor: getColorHex(color) }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="preview-actions">
        <Button @click="resetCustomization" variant="outline">
          Réinitialiser
        </Button>
        <Button @click="saveCustomization" variant="primary">
          Valider la personnalisation
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@ns2po/ui'
import CloudinaryUpload from './CloudinaryUpload.vue'
import type { 
  Product, 
  ProductCustomization, 
  CustomizationPosition,
  CloudinaryUploadResult 
} from '@ns2po/types'

// Interface mutable pour la personnalisation du composant
interface MutableProductCustomization {
  logoUrl?: string
  text?: string
  colors?: string[]
  position?: CustomizationPosition
}

interface Props {
  product: Product
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'customization:change': [customization: ProductCustomization]
  'customization:save': [customization: ProductCustomization]
}>()

// État de personnalisation
const customization = ref<MutableProductCustomization>({
  logoUrl: undefined,
  text: '',
  colors: [],
  position: 'FRONT'
})

// Configuration du canvas
const canvasWidth = 400
const canvasHeight = 500
const previewCanvas = ref<HTMLCanvasElement>()

// Positions disponibles
const availablePositions = [
  { value: 'FRONT', label: 'Devant', icon: 'IconShirtFront' },
  { value: 'BACK', label: 'Dos', icon: 'IconShirtBack' },
  { value: 'SLEEVE', label: 'Manche', icon: 'IconShirtSleeve' },
  { value: 'CHEST', label: 'Poitrine', icon: 'IconShirtChest' }
] as const

// Couleurs disponibles
const availableColors = [
  { value: 'red', name: 'Rouge', hex: '#EF4444' },
  { value: 'blue', name: 'Bleu', hex: '#3B82F6' },
  { value: 'green', name: 'Vert', hex: '#10B981' },
  { value: 'yellow', name: 'Jaune', hex: '#F59E0B' },
  { value: 'purple', name: 'Violet', hex: '#8B5CF6' },
  { value: 'orange', name: 'Orange', hex: '#F97316' },
  { value: 'pink', name: 'Rose', hex: '#EC4899' },
  { value: 'black', name: 'Noir', hex: '#1F2937' },
  { value: 'white', name: 'Blanc', hex: '#FFFFFF' },
  { value: 'gray', name: 'Gris', hex: '#6B7280' }
]

// Méthodes
const handleLogoUpload = (result: CloudinaryUploadResult) => {
  customization.value.logoUrl = result.secure_url
  updatePreview()
  emitChange()
}

const handleUploadError = (error: string) => {
  console.error('Erreur upload logo:', error)
  // TODO: Afficher notification d'erreur
}

const toggleColor = (color: string) => {
  if (!customization.value.colors) {
    customization.value.colors = []
  }
  
  const currentColors = [...customization.value.colors]
  const index = currentColors.indexOf(color)
  
  if (index > -1) {
    currentColors.splice(index, 1)
  } else {
    currentColors.push(color)
  }
  
  customization.value.colors = currentColors
  updatePreview()
  emitChange()
}

const getPositionLabel = (position: CustomizationPosition): string => {
  return availablePositions.find(p => p.value === position)?.label || position
}

const getColorHex = (color: string): string => {
  return availableColors.find(c => c.value === color)?.hex || '#000000'
}

const updatePreview = async () => {
  await nextTick()
  
  if (!previewCanvas.value) return
  
  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Effacer le canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  try {
    // Dessiner l'image de base du produit
    if (props.product.image) {
      const productImg = new Image()
      productImg.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        productImg.onload = resolve
        productImg.onerror = reject
        productImg.src = props.product.image!
      })

      // Dessiner l'image du produit
      ctx.drawImage(productImg, 0, 0, canvasWidth, canvasHeight)
    } else {
      // Image par défaut (rectangle avec texte)
      ctx.fillStyle = '#F3F4F6'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      ctx.fillStyle = '#6B7280'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Image du produit', canvasWidth / 2, canvasHeight / 2)
    }

    // Appliquer les couleurs (effet overlay)
    if (customization.value.colors?.length) {
      const primaryColor = customization.value.colors[0]
      const colorHex = primaryColor ? getColorHex(primaryColor) : '#000000'
      
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = colorHex
      ctx.globalAlpha = 0.3
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    // Dessiner le logo si présent
    if (customization.value.logoUrl) {
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
        logoImg.src = customization.value.logoUrl!
      })

      // Position du logo selon la zone sélectionnée
      const logoSize = 80
      const positions = {
        FRONT: { x: canvasWidth / 2 - logoSize / 2, y: canvasHeight * 0.3 },
        BACK: { x: canvasWidth / 2 - logoSize / 2, y: canvasHeight * 0.2 },
        SLEEVE: { x: canvasWidth * 0.15, y: canvasHeight * 0.4 },
        CHEST: { x: canvasWidth / 2 - logoSize / 2, y: canvasHeight * 0.25 }
      }

      const pos = positions[customization.value.position || 'FRONT']
      ctx.drawImage(logoImg, pos.x, pos.y, logoSize, logoSize)
    }

    // Dessiner le texte si présent
    if (customization.value.text) {
      const textPositions = {
        FRONT: { x: canvasWidth / 2, y: canvasHeight * 0.6 },
        BACK: { x: canvasWidth / 2, y: canvasHeight * 0.5 },
        SLEEVE: { x: canvasWidth * 0.15, y: canvasHeight * 0.6 },
        CHEST: { x: canvasWidth / 2, y: canvasHeight * 0.45 }
      }

      const pos = textPositions[customization.value.position || 'FRONT']
      
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.textAlign = 'center'
      
      ctx.strokeText(customization.value.text, pos.x, pos.y)
      ctx.fillText(customization.value.text, pos.x, pos.y)
    }

  } catch (error) {
    console.error('Erreur lors du rendu de la prévisualisation:', error)
  }
}

const resetCustomization = () => {
  customization.value = {
    logoUrl: undefined,
    text: '',
    colors: [],
    position: 'FRONT'
  }
  updatePreview()
  emitChange()
}

const saveCustomization = () => {
  emit('customization:save', { ...customization.value })
}

const emitChange = () => {
  emit('customization:change', { ...customization.value })
}

// Watchers
watch(() => customization.value.text, () => {
  updatePreview()
  emitChange()
})

watch(() => customization.value.position, () => {
  updatePreview()
  emitChange()
})

// Initialisation
onMounted(() => {
  updatePreview()
})

// Composants icônes simplifiés (à remplacer par vraies icônes)
const IconShirtFront = () => h('div', { class: 'w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs' }, 'F')
const IconShirtBack = () => h('div', { class: 'w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs' }, 'B')
const IconShirtSleeve = () => h('div', { class: 'w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs' }, 'M')
const IconShirtChest = () => h('div', { class: 'w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs' }, 'P')
</script>

<style scoped>
.product-preview {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto;
}

.customization-panel,
.preview-panel {
  @apply bg-white rounded-lg shadow-lg p-6;
}

.panel-title {
  @apply text-xl font-bold text-gray-900 mb-6;
}

.customization-section {
  @apply mb-6;
}

.section-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.text-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.position-grid {
  @apply grid grid-cols-2 gap-3;
}

.position-btn {
  @apply flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors;
}

.position-btn--active {
  @apply border-blue-500 bg-blue-50;
}

.position-icon {
  @apply mb-2;
}

.color-grid {
  @apply grid grid-cols-5 gap-2;
}

.color-btn {
  @apply w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center transition-all hover:scale-110;
}

.color-btn--selected {
  @apply border-gray-900 ring-2 ring-offset-2 ring-blue-500;
}

.color-check {
  @apply w-4 h-4;
}

.preview-container {
  @apply relative bg-gray-100 rounded-lg overflow-hidden mb-6;
}

.preview-canvas {
  @apply w-full max-w-md mx-auto block;
}

.preview-overlay {
  @apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4;
}

.overlay-content {
  @apply text-white;
}

.product-name {
  @apply text-lg font-bold mb-1;
}

.product-category {
  @apply text-sm opacity-90 mb-3;
}

.customization-summary {
  @apply space-y-1;
}

.summary-item {
  @apply flex items-center space-x-2 text-sm;
}

.summary-label {
  @apply font-medium;
}

.summary-value {
  @apply opacity-90;
}

.summary-colors {
  @apply flex space-x-1;
}

.summary-color {
  @apply w-4 h-4 rounded-full border border-white/30;
}

.preview-actions {
  @apply flex space-x-3;
}
</style>