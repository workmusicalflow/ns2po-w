<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click="onBackdropClick"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
        @click.stop
      >
        <!-- Header avec icône -->
        <div :class="headerClasses">
          <div class="flex items-center space-x-3">
            <div :class="iconContainerClasses">
              <Icon :name="iconName" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">{{ title }}</h3>
              <p class="text-sm opacity-90">{{ subtitle }}</p>
            </div>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="p-6">
          <p class="text-gray-700 mb-4">{{ message }}</p>

          <!-- Informations spécifiques par type -->
          <div v-if="details" :class="detailsClasses">
            <div class="flex items-start space-x-2">
              <Icon :name="detailsIcon" class="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p class="text-sm">{{ details }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            @click="onCancel"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Annuler
          </button>
          <button
            @click="onConfirm"
            :class="confirmButtonClasses"
            class="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  source: string
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}

const props = defineProps<Props>()

// Configuration par type de source
const config = computed(() => {
  switch (props.source) {
    case 'cloudinary-auto-discovery':
      return {
        type: 'soft-delete',
        title: 'Désactiver la réalisation',
        subtitle: 'Action réversible',
        message: `Voulez-vous désactiver "${props.itemName}" ?`,
        details: 'Cette réalisation sera masquée mais pourra être réactivée. Elle ne sera plus découverte automatiquement.',
        confirmText: 'Désactiver',
        icon: 'heroicons:eye-slash',
        detailsIcon: 'heroicons:information-circle',
        colorScheme: 'orange'
      }

    case 'turso':
      return {
        type: 'hard-delete',
        title: 'Supprimer définitivement',
        subtitle: 'Action irréversible',
        message: `Voulez-vous supprimer définitivement "${props.itemName}" ?`,
        details: 'Cette action est irréversible. La réalisation sera supprimée de la base de données.',
        confirmText: 'Supprimer',
        icon: 'heroicons:trash',
        detailsIcon: 'heroicons:exclamation-triangle',
        colorScheme: 'red'
      }

    default:
      return {
        type: 'unknown',
        title: 'Confirmer l\'action',
        subtitle: 'Vérification requise',
        message: `Voulez-vous traiter "${props.itemName}" ?`,
        details: 'Veuillez confirmer cette action.',
        confirmText: 'Confirmer',
        icon: 'heroicons:question-mark-circle',
        detailsIcon: 'heroicons:information-circle',
        colorScheme: 'gray'
      }
  }
})

// Classes calculées pour l'interface
const headerClasses = computed(() => {
  const base = 'px-6 py-4 border-b'
  switch (config.value.colorScheme) {
    case 'orange':
      return `${base} bg-orange-50 border-orange-200 text-orange-900`
    case 'red':
      return `${base} bg-red-50 border-red-200 text-red-900`
    default:
      return `${base} bg-gray-50 border-gray-200 text-gray-900`
  }
})

const iconContainerClasses = computed(() => {
  const base = 'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center'
  switch (config.value.colorScheme) {
    case 'orange':
      return `${base} bg-orange-100 text-orange-600`
    case 'red':
      return `${base} bg-red-100 text-red-600`
    default:
      return `${base} bg-gray-100 text-gray-600`
  }
})

const detailsClasses = computed(() => {
  const base = 'p-3 rounded-md'
  switch (config.value.colorScheme) {
    case 'orange':
      return `${base} bg-orange-50 border border-orange-200 text-orange-800`
    case 'red':
      return `${base} bg-red-50 border border-red-200 text-red-800`
    default:
      return `${base} bg-gray-50 border border-gray-200 text-gray-800`
  }
})

const confirmButtonClasses = computed(() => {
  switch (config.value.colorScheme) {
    case 'orange':
      return 'text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
    case 'red':
      return 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
    default:
      return 'text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
  }
})

// Propriétés simplifiées pour le template
const title = computed(() => config.value.title)
const subtitle = computed(() => config.value.subtitle)
const message = computed(() => config.value.message)
const details = computed(() => config.value.details)
const confirmText = computed(() => config.value.confirmText)
const iconName = computed(() => config.value.icon)
const detailsIcon = computed(() => config.value.detailsIcon)

// Gestion des événements
const onBackdropClick = () => {
  props.onCancel()
}

const onConfirm = () => {
  props.onConfirm()
}

const onCancel = () => {
  props.onCancel()
}
</script>