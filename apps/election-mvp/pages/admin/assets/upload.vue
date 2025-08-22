<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center">
          <NuxtLink 
            to="/admin/assets" 
            class="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Retour
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              ⬆️ Upload Assets NS2PO
            </h1>
            <p class="text-gray-500">
              Ajoutez de nouveaux assets visuels au système
            </p>
          </div>
        </div>
      </div>

      <!-- Upload Form -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            📁 Sélectionner Fichiers
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            Formats supportés : PNG, JPG, SVG, WebP (max 10 MB par fichier)
          </p>
        </div>

        <div class="p-6">
          <!-- Drop Zone -->
          <div 
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
          >
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="mt-4">
              <label for="file-upload" class="cursor-pointer">
                <span class="text-lg font-medium text-blue-600 hover:text-blue-500">
                  Cliquez pour sélectionner
                </span>
                <span class="text-gray-500"> ou glissez-déposez vos fichiers ici</span>
                <input id="file-upload" name="file-upload" type="file" class="sr-only" multiple accept="image/*" @change="handleFileSelect">
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              PNG, JPG, SVG, WebP jusqu'à 10MB
            </p>
          </div>

          <!-- Selected Files -->
          <div v-if="selectedFiles.length > 0" class="mt-6">
            <h4 class="text-sm font-medium text-gray-900 mb-4">
              📋 Fichiers sélectionnés ({{ selectedFiles.length }})
            </h4>
            
            <div class="space-y-4">
              <div v-for="(file, index) in selectedFiles" :key="index" class="flex items-center justify-between p-4 border rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-12 w-12">
                    <img 
                      v-if="file.preview" 
                      :src="file.preview" 
                      :alt="file.name"
                      class="h-12 w-12 rounded-lg object-cover"
                    >
                    <div v-else class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span class="text-gray-400 text-xs">📄</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ file.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ formatFileSize(file.size) }} • {{ file.type }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center">
                  <!-- Métadonnées pour chaque fichier -->
                  <div class="mr-4">
                    <select 
                      v-model="file.category" 
                      class="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Catégorie...</option>
                      <option value="Produits - Textiles">Produits - Textiles</option>
                      <option value="Produits - Gadgets">Produits - Gadgets</option>
                      <option value="Produits - EPI">Produits - EPI</option>
                      <option value="Logos - Clients">Logos - Clients</option>
                      <option value="Logos - Marque NS2PO">Logos - Marque NS2PO</option>
                      <option value="Backgrounds - Élections">Backgrounds - Élections</option>
                      <option value="Hero - Banners">Hero - Banners</option>
                    </select>
                  </div>

                  <!-- Status upload -->
                  <div class="mr-4">
                    <span v-if="file.uploading" class="text-xs text-blue-600">
                      <svg class="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600 inline" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Upload...
                    </span>
                    <span v-else-if="file.uploaded" class="text-xs text-green-600">
                      ✅ Envoyé
                    </span>
                    <span v-else-if="file.error" class="text-xs text-red-600">
                      ❌ Erreur
                    </span>
                  </div>

                  <!-- Supprimer -->
                  <button 
                    @click="removeFile(index)"
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="selectedFiles.length > 0" class="mt-6 flex justify-end space-x-4">
            <button 
              @click="selectedFiles = []"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tout effacer
            </button>
            <button 
              @click="uploadAllFiles"
              :disabled="uploading || selectedFiles.every(f => f.uploaded)"
              class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ uploading ? 'Upload en cours...' : 'Uploader tous les fichiers' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Guide Convention de Nommage -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-medium text-blue-900 mb-4">
          📋 Convention de Nommage NS2PO
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 class="font-medium text-blue-800 mb-2">Produits Textiles</h4>
            <ul class="text-blue-700 space-y-1">
              <li><code>textile-polo-blanc-ns2po.png</code></li>
              <li><code>textile-tshirt-noir-logo-pdci.jpg</code></li>
              <li><code>textile-casquette-rouge-campagne.png</code></li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-800 mb-2">Gadgets</h4>
            <ul class="text-blue-700 space-y-1">
              <li><code>gadget-usb-logo-parti.png</code></li>
              <li><code>gadget-stylo-bleu-campagne.jpg</code></li>
              <li><code>gadget-mug-blanc-photo.png</code></li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-800 mb-2">Logos Clients</h4>
            <ul class="text-blue-700 space-y-1">
              <li><code>logo-pdci-officiel-couleur.svg</code></li>
              <li><code>logo-client-rhdp-noir.png</code></li>
              <li><code>logo-parti-independant.png</code></li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-800 mb-2">Backgrounds</h4>
            <ul class="text-blue-700 space-y-1">
              <li><code>bg-election-orange-moderne.jpg</code></li>
              <li><code>bg-campagne-bleu-drapeau.png</code></li>
              <li><code>bg-politique-vert-nature.jpg</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="notification.show" 
         class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end">
      <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <span :class="notification.type === 'success' ? 'text-green-400' : 'text-red-400'">
                {{ notification.type === 'success' ? '✅' : '❌' }}
              </span>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  title: 'Upload Assets NS2PO',
  description: 'Interface d\'upload pour nouveaux assets'
})

// État réactif
const selectedFiles = ref([])
const isDragging = ref(false)
const uploading = ref(false)

const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: ''
})

// Fonctions utilitaires
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

const createFilePreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

// Gestion des fichiers
const processFiles = async (files) => {
  for (const file of files) {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Type de fichier invalide', `${file.name} n'est pas une image`)
      continue
    }

    // Vérifier la taille
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'Fichier trop volumineux', `${file.name} dépasse 10 MB`)
      continue
    }

    // Créer l'objet fichier enrichi
    const enrichedFile = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: await createFilePreview(file),
      category: '',
      uploading: false,
      uploaded: false,
      error: false
    }

    selectedFiles.value.push(enrichedFile)
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const uploadSingleFile = async (fileObj) => {
  if (!fileObj.category) {
    showNotification('error', 'Catégorie manquante', `Sélectionnez une catégorie pour ${fileObj.name}`)
    return false
  }

  try {
    fileObj.uploading = true
    
    const formData = new FormData()
    formData.append('file', fileObj.file)
    formData.append('category', fileObj.category)
    formData.append('originalName', fileObj.name)

    const response = await $fetch('/api/admin/upload-asset', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      fileObj.uploaded = true
      fileObj.uploading = false
      return true
    } else {
      throw new Error(response.error || 'Erreur upload')
    }

  } catch (error) {
    console.error('Erreur upload:', error)
    fileObj.error = true
    fileObj.uploading = false
    showNotification('error', 'Erreur upload', `${fileObj.name}: ${error.message}`)
    return false
  }
}

const uploadAllFiles = async () => {
  uploading.value = true
  let successCount = 0
  let errorCount = 0

  for (const fileObj of selectedFiles.value) {
    if (fileObj.uploaded) continue
    
    const success = await uploadSingleFile(fileObj)
    if (success) {
      successCount++
    } else {
      errorCount++
    }
  }

  uploading.value = false

  if (successCount > 0) {
    showNotification('success', 'Upload terminé', `${successCount} fichier(s) envoyé(s) avec succès`)
  }

  if (errorCount > 0) {
    showNotification('error', 'Erreurs détectées', `${errorCount} fichier(s) ont échoué`)
  }
}

// Gestion du drag & drop
onMounted(() => {
  const handleDragEnter = () => { isDragging.value = true }
  const handleDragLeave = () => { isDragging.value = false }

  document.addEventListener('dragenter', handleDragEnter)
  document.addEventListener('dragleave', handleDragLeave)

  onBeforeUnmount(() => {
    document.removeEventListener('dragenter', handleDragEnter)
    document.removeEventListener('dragleave', handleDragLeave)
  })
})
</script>