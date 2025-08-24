<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            🎯 Gestion Assets NS2PO
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Interface simplifiée pour gérer les assets visuels - 
            <a 
              href="https://airtable.com/apprQLdnVwlbfnioT" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800"
              aria-label="Ouvrir le tableau Airtable dans un nouvel onglet"
            >
              Voir dans Airtable ↗
            </a>
          </p>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
          <button 
            :disabled="syncing"
            class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            :aria-label="syncing ? 'Synchronisation en cours avec Airtable' : 'Synchroniser avec Airtable'"
            @click="syncWithAirtable"
          >
            <svg 
              class="w-4 h-4 mr-2" 
              :class="{ 'animate-spin': syncing }" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ syncing ? 'Synchronisation...' : 'Sync Airtable' }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">✅</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Assets Actifs
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ stats.active }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">🔄</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    En Traitement
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ stats.processing }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">📄</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Brouillons
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ stats.draft }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm">🗄</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Archivés
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ stats.archived }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg mb-8">
        <div class="px-6 py-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="category-filter" class="block text-sm font-medium text-gray-700">Catégorie</label>
              <select 
                id="category-filter"
                v-model="filters.category" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="category-filter-description"
              >
                <option value="">
                  Toutes
                </option>
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>
            <div>
              <label for="status-filter" class="block text-sm font-medium text-gray-700">Statut</label>
              <select 
                id="status-filter"
                v-model="filters.status" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="status-filter-description"
              >
                <option value="">
                  Tous
                </option>
                <option value="✅ Active">
                  ✅ Active
                </option>
                <option value="🔄 Processing">
                  🔄 Processing
                </option>
                <option value="📄 Draft">
                  📄 Draft
                </option>
                <option value="🗄 Archived">
                  🗄 Archived
                </option>
              </select>
            </div>
            <div>
              <label for="search-filter" class="block text-sm font-medium text-gray-700">Recherche</label>
              <input 
                id="search-filter"
                v-model="filters.search" 
                type="text" 
                placeholder="Nom ou tags..."
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="search-filter-description"
              >
            </div>
          </div>
          <!-- Hidden descriptions for screen readers -->
          <div class="sr-only">
            <div id="category-filter-description">
              Filtrer les assets par catégorie. Sélectionnez "Toutes" pour voir tous les assets.
            </div>
            <div id="status-filter-description">
              Filtrer les assets par statut. Sélectionnez "Tous" pour voir tous les statuts.
            </div>
            <div id="search-filter-description">
              Rechercher dans les noms d'assets, tags ou notes. La recherche est insensible à la casse.
            </div>
          </div>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200" role="table" aria-label="Tableau des assets NS2PO">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimensions
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modifié
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="asset in filteredAssets" :key="asset.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-12 w-12">
                    <img 
                      v-if="asset.fields.CloudinaryURL" 
                      :src="asset.fields.CloudinaryURL + '?w=48&h=48&c_fill'" 
                      :alt="`Image de l'asset ${asset.fields.AssetName || 'sans nom'}`"
                      class="h-12 w-12 rounded-lg object-cover shadow-sm"
                      loading="lazy"
                    >
                    <div v-else class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center" aria-label="Aucune image disponible">
                      <span class="text-gray-400 text-xs" aria-hidden="true">📄</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ asset.fields.AssetName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ asset.fields.OriginalFilename }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ asset.fields.Category }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ asset.fields.Subcategory }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getStatusClass(asset.fields.Status)"
                >
                  {{ asset.fields.Status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ asset.fields.Dimensions || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(asset.fields.UpdatedAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a 
                  v-if="asset.fields.CloudinaryURL" 
                  :href="asset.fields.CloudinaryURL" 
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                  :aria-label="`Voir l'asset ${asset.fields.AssetName} dans un nouvel onglet`"
                >
                  Voir
                </a>
                <button 
                  class="text-green-600 hover:text-green-900"
                  :aria-label="`Modifier l'asset ${asset.fields.AssetName} dans Airtable`"
                  @click="openInAirtable(asset.id)"
                >
                  Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="filteredAssets.length === 0" class="text-center py-12">
          <div class="text-gray-500">
            <svg 
              class="mx-auto h-12 w-12 text-gray-400" 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">
              Aucun asset trouvé
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ assets.length === 0 ? 'Lancez une synchronisation avec Airtable' : 'Modifiez vos filtres de recherche' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          🚀 Actions Rapides
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://airtable.com/apprQLdnVwlbfnioT/tbla8baaBOSTBRtEM/viwz6z96bAPQThPxF"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            aria-label="Ouvrir le dashboard Airtable avec vue complète de tous les assets"
          >
            <div class="flex-shrink-0">
              <span class="text-2xl" aria-hidden="true">📊</span>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-gray-900">Dashboard Airtable</h4>
              <p class="text-sm text-gray-500">Vue complète tous assets</p>
            </div>
          </a>

          <a 
            href="https://airtable.com/apprQLdnVwlbfnioT/tblu9ymi5efOHcwFj"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
            aria-label="Ouvrir la configuration des vues Airtable pour personnaliser l'affichage"
          >
            <div class="flex-shrink-0">
              <span class="text-2xl" aria-hidden="true">🎨</span>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-gray-900">Config des Vues</h4>
              <p class="text-sm text-gray-500">Personnaliser les vues</p>
            </div>
          </a>

          <NuxtLink 
            to="/admin/assets/upload"
            class="flex items-center p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            aria-label="Aller vers la page d'upload pour ajouter de nouveaux assets"
          >
            <div class="flex-shrink-0">
              <span class="text-2xl" aria-hidden="true">⬆️</span>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-gray-900">
                Upload Assets
              </h4>
              <p class="text-sm text-gray-500">
                Ajouter nouveaux fichiers
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="notification.show" 
      class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <span 
                :class="notification.type === 'success' ? 'text-green-400' : 'text-red-400'"
                aria-hidden="true"
              >
                {{ notification.type === 'success' ? '✅' : '❌' }}
              </span>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p class="mt-1 text-sm text-gray-500">
                {{ notification.message }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  title: 'Gestion Assets NS2PO',
  description: 'Interface d\'administration pour gérer les assets visuels'
})

// État réactif
const assets = ref([])
const syncing = ref(false)
const filters = ref({
  category: '',
  status: '',
  search: ''
})

const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: ''
})

// Stats calculées
const stats = computed(() => {
  const active = assets.value.filter(a => a.fields.Status === '✅ Active').length
  const processing = assets.value.filter(a => a.fields.Status === '🔄 Processing').length  
  const draft = assets.value.filter(a => a.fields.Status === '📄 Draft').length
  const archived = assets.value.filter(a => a.fields.Status === '🗄 Archived').length
  
  return { active, processing, draft, archived }
})

// Catégories disponibles
const categories = computed(() => {
  const cats = [...new Set(assets.value.map(a => a.fields.Category).filter(Boolean))]
  return cats.sort()
})

// Assets filtrés
const filteredAssets = computed(() => {
  let filtered = assets.value

  if (filters.value.category) {
    filtered = filtered.filter(a => a.fields.Category === filters.value.category)
  }

  if (filters.value.status) {
    filtered = filtered.filter(a => a.fields.Status === filters.value.status)
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(a => 
      a.fields.AssetName?.toLowerCase().includes(search) ||
      a.fields.Tags?.toLowerCase().includes(search) ||
      a.fields.Notes?.toLowerCase().includes(search)
    )
  }

  return filtered.sort((a, b) => new Date(b.fields.UpdatedAt) - new Date(a.fields.UpdatedAt))
})

// Fonctions utilitaires
const getStatusClass = (status) => {
  const classes = {
    '✅ Active': 'bg-green-100 text-green-800',
    '🔄 Processing': 'bg-yellow-100 text-yellow-800', 
    '📄 Draft': 'bg-blue-100 text-blue-800',
    '🗄 Archived': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

const openInAirtable = (recordId) => {
  const url = `https://airtable.com/apprQLdnVwlbfnioT/tbla8baaBOSTBRtEM/${recordId}`
  window.open(url, '_blank')
}

// Actions
const syncWithAirtable = async () => {
  syncing.value = true
  try {
    const { data } = await $fetch('/api/admin/sync-assets')
    assets.value = data.assets
    showNotification('success', 'Synchronisation réussie', `${data.assets.length} assets récupérés`)
  } catch (error) {
    console.error('Erreur sync:', error)
    showNotification('error', 'Erreur synchronisation', error.message)
  } finally {
    syncing.value = false
  }
}

// Initialisation
onMounted(async () => {
  await syncWithAirtable()
})
</script>