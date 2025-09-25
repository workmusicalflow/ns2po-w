/**
 * Nuxt 3 Global Types Extension
 */

declare global {
  interface NuxtFetchOptions<T = any> {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: any
    params?: Record<string, any>
    query?: Record<string, any>
    headers?: Record<string, string>
    baseURL?: string
    server?: boolean
    lazy?: boolean
    default?: () => T | Ref<T>
    transform?: (input: any) => T | Promise<T>
    pick?: string[]
    watch?: WatchSource[]
    key?: string
  }

  function $fetch<T = any>(
    url: string,
    options?: NuxtFetchOptions<T>
  ): Promise<T>
}

export {}