import { VueQueryPlugin, QueryClient, dehydrate, hydrate, VueQueryPluginOptions } from '@tanstack/vue-query'

export default defineNuxtPlugin({
  name: 'vue-query',
  parallel: false,
  setup(nuxtApp) {
    // Configuration du QueryClient avec settings SSR-safe
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false, // Désactivé en SSR
          refetchOnReconnect: false, // Désactivé en SSR
          refetchOnMount: true,
          throwOnError: false,
          retry: import.meta.client ? 3 : false, // Pas de retry côté serveur
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
          throwOnError: false,
        }
      }
    })

    const vueQueryOptions: VueQueryPluginOptions = {
      queryClient
    }

    nuxtApp.vueApp.use(VueQueryPlugin, vueQueryOptions)

    // Hydratation pour SSR
    if (import.meta.server) {
      nuxtApp.ssrContext!.nuxt = nuxtApp.ssrContext!.nuxt || {}
      nuxtApp.ssrContext!.nuxt.vueQueryState = { toJSON: () => dehydrate(queryClient) }
    }

    if (import.meta.client) {
      nuxtApp.hook('app:created', () => {
        if (nuxtApp.ssrContext?.nuxt?.vueQueryState) {
          hydrate(queryClient, nuxtApp.ssrContext.nuxt.vueQueryState)
        }
      })
    }
  }
})