import { VueQueryPlugin, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'

export default defineNuxtPlugin({
  name: 'vue-query',
  parallel: false,
  setup(nuxtApp) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
          refetchOnWindowFocus: import.meta.client,
          refetchOnReconnect: import.meta.client,
          refetchOnMount: true,
          throwOnError: false,
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
  }
})