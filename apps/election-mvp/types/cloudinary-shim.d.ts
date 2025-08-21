declare module '@nuxtjs/cloudinary/dist/runtime/components/*' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<any, any, any>
  export default component
}

// Shim pour résoudre les erreurs #imports dans les composants Cloudinary
declare module '#imports' {
  export * from '@nuxtjs/cloudinary/dist/runtime/composables'
  export const useCldImageUrl: any
  export const useCldVideoUrl: any
  export const getCldImageUrl: any
  export const getCldVideoUrl: any
  export const useRuntimeConfig: any
  export const useRouter: any
}