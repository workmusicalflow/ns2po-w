export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false  // Désactivé pour éviter oxc-parser en CI, utilise vue-tsc
  },

  // CSS framework - will add Tailwind later
  css: [],

  // Build configuration
  build: {
    transpile: ['@ns2po/ui', '@ns2po/composables']
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    tursoUrl: process.env.TURSO_DATABASE_URL,
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    airtableApiKey: process.env.AIRTABLE_API_KEY,
    airtableBaseId: process.env.AIRTABLE_BASE_ID,
    
    // Public keys (exposed to client-side)
    public: {
      appName: 'NS2PO Election MVP',
      version: '0.1.0',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME
    }
  },

  // Auto-import configuration
  imports: {
    dirs: ['composables', 'utils']
  },

  // Modules
  modules: [
    '@nuxtjs/cloudinary'
  ],

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  },

  // App configuration
  app: {
    head: {
      title: 'NS2PO Election MVP',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Plateforme électorale numérique NS2PO' }
      ]
    }
  }
})