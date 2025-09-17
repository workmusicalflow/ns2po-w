<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo -->
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
          <span class="text-white font-bold text-xl">NS</span>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Administration NS2PO
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Accès sécurisé au CMS d'administration
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="admin@ns2po.com"
              />
            </div>
          </div>

          <!-- Mot de passe -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                required
                class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Messages d'erreur -->
          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <Icon name="heroicons:x-circle" class="h-5 w-5 text-red-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Erreur d'authentification
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ error }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bouton de connexion -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ isLoading ? 'Connexion...' : 'Se connecter' }}
            </button>
          </div>
        </form>

        <!-- Development Mode Notice -->
        <div v-if="isDevelopment" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-yellow-600 mt-0.5" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Mode Développement</h3>
              <p class="text-sm text-yellow-700 mt-1">
                L'authentification est désactivée en développement.
                <NuxtLink to="/admin" class="font-medium underline">
                  Accéder directement à l'admin
                </NuxtLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Pas de layout pour la page de login
definePageMeta({
  layout: false
})

// Head
useHead({
  title: 'Connexion Admin | NS2PO'
})

// Reactive data
const form = ref({
  email: '',
  password: ''
})
const isLoading = ref(false)
const error = ref('')

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development'

// Login handler
async function handleLogin() {
  isLoading.value = true
  error.value = ''

  try {
    // Validation basique
    if (!form.value.email || !form.value.password) {
      throw new Error('Email et mot de passe requis')
    }

    // TODO: Implémenter vraie authentification
    // Pour l'instant, authentification simple pour demo
    if (form.value.email === 'admin@ns2po.com' && form.value.password === 'admin123') {
      // Stocker le token d'auth (temporaire)
      if (process.client) {
        localStorage.setItem('ns2po_admin_token', 'demo-token')
      }

      // Rediriger vers l'admin
      await navigateTo('/admin')
    } else {
      throw new Error('Email ou mot de passe incorrect')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur de connexion'
  } finally {
    isLoading.value = false
  }
}

// Redirection si déjà connecté
onMounted(() => {
  if (process.client) {
    const token = localStorage.getItem('ns2po_admin_token')
    if (token) {
      navigateTo('/admin')
    }
  }
})
</script>