<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Blacklist Auto-Discovery</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gestion des réalisations blacklistées pour éviter leur re-découverte automatique
        </p>
      </div>
      <button
        @click="refreshData"
        class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        :disabled="isLoading"
      >
        <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" />
        Actualiser
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:x-circle" class="h-6 w-6 text-red-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Blacklisté</dt>
                <dd class="text-lg font-medium text-gray-900">{{ blacklistItems.length }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:clock" class="h-6 w-6 text-yellow-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Aujourd'hui</dt>
                <dd class="text-lg font-medium text-gray-900">{{ todayCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:user" class="h-6 w-6 text-blue-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Par Admin</dt>
                <dd class="text-lg font-medium text-gray-900">{{ adminCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          Éléments Blacklistés
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          Liste des réalisations qui ne seront plus découvertes automatiquement
        </p>
      </div>

      <div v-if="isLoading" class="p-8 text-center">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p class="mt-2 text-gray-500">Chargement...</p>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 mx-auto text-red-400" />
        <p class="mt-2 text-red-600">{{ error }}</p>
        <button @click="refreshData" class="mt-2 text-sm text-primary-600 hover:text-primary-500">
          Réessayer
        </button>
      </div>

      <ul v-else-if="blacklistItems.length > 0" class="divide-y divide-gray-200">
        <li v-for="item in blacklistItems" :key="item.id" class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center min-w-0">
              <div class="flex-shrink-0">
                <Icon name="heroicons:photo" class="h-8 w-8 text-gray-400" />
              </div>
              <div class="ml-4 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ item.public_id }}
                </p>
                <p v-if="item.original_title" class="text-sm text-gray-500 truncate">
                  {{ item.original_title }}
                </p>
                <div class="flex items-center mt-1 space-x-4 text-xs text-gray-400">
                  <span>{{ formatReason(item.reason) }}</span>
                  <span>•</span>
                  <span>{{ formatDate(item.blacklisted_at) }}</span>
                  <span>•</span>
                  <span>Par {{ item.blacklisted_by }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="removeFromBlacklist(item)"
                class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                :disabled="isRemoving === item.public_id"
              >
                <Icon
                  name="heroicons:check-circle"
                  class="w-3 h-3 mr-1"
                  :class="{ 'animate-spin': isRemoving === item.public_id }"
                />
                {{ isRemoving === item.public_id ? 'Retrait...' : 'Restaurer' }}
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="p-8 text-center">
        <Icon name="heroicons:inbox" class="w-12 h-12 mx-auto text-gray-300" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun élément blacklisté</h3>
        <p class="mt-1 text-sm text-gray-500">
          Toutes les réalisations auto-discovery sont actuellement disponibles
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BlacklistItem {
  id: number
  public_id: string
  original_title?: string
  reason: string
  blacklisted_at: string
  blacklisted_by: string
}

// Meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// State
const blacklistItems = ref<BlacklistItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const isRemoving = ref<string | null>(null)

// Computed
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return blacklistItems.value.filter(item =>
    new Date(item.blacklisted_at).toDateString() === today
  ).length
})

const adminCount = computed(() => {
  return blacklistItems.value.filter(item =>
    item.blacklisted_by === 'admin'
  ).length
})

// Methods
async function refreshData() {
  isLoading.value = true
  error.value = null

  try {
    const { data } = await $fetch<{ success: boolean, data: BlacklistItem[] }>('/api/admin/blacklist')
    blacklistItems.value = data
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Erreur lors du chargement'
    console.error('Erreur chargement blacklist:', err)
  } finally {
    isLoading.value = false
  }
}

async function removeFromBlacklist(item: BlacklistItem) {
  if (!confirm(`Êtes-vous sûr de vouloir restaurer "${item.public_id}" ? Il pourra être re-découvert automatiquement.`)) {
    return
  }

  isRemoving.value = item.public_id

  try {
    await $fetch(`/api/admin/blacklist/${encodeURIComponent(item.public_id)}`, {
      method: 'DELETE'
    })

    // Retirer de la liste locale
    blacklistItems.value = blacklistItems.value.filter(i => i.id !== item.id)

    // Notification de succès
    console.log(`✅ Élément retiré de la blacklist: ${item.public_id}`)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Erreur lors de la suppression'
    console.error('Erreur retrait blacklist:', err)
  } finally {
    isRemoving.value = null
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    'user_deleted': 'Supprimé par utilisateur',
    'user_deleted_auto_discovery': 'Auto-discovery supprimée',
    'test_data': 'Données de test',
    'duplicate': 'Doublon',
    'inappropriate': 'Contenu inapproprié'
  }

  return reasonMap[reason] || reason
}

// Init
onMounted(() => {
  refreshData()
})
</script>