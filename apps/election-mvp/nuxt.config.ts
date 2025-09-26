export default defineNuxtConfig({
  devtools: {
    enabled: process.env.NODE_ENV === 'development',
    timeline: {
      enabled: true
    },
    // Évite les erreurs de performance
    vscode: {
      enabled: false // Désactive intégration VSCode si problématique
    }
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Désactivé pour éviter oxc-parser en CI, utilise vue-tsc
    tsConfig: {
      compilerOptions: {
        skipLibCheck: true
      }
    }
  },

  // CSS framework
  css: ["~/assets/css/main.css", "~/assets/css/themes.css"],

  // Build configuration
  build: {
    transpile: ["@ns2po/ui", "@ns2po/composables"],
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    turso: {
      databaseUrl: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    airtableApiKey: process.env.AIRTABLE_API_KEY,
    airtableBaseId: process.env.AIRTABLE_BASE_ID,

    // SMTP Configuration
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_SECURE,

    // Public keys (exposed to client-side)
    public: {
      appName: "NS2PO Election MVP",
      version: "0.1.0",
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
      googleAnalyticsId: process.env.NUXT_PUBLIC_GA_MEASUREMENT_ID,
    },
  },

  // Auto-import configuration
  imports: {
    dirs: ["composables", "utils"],
  },

  // Modules
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/cloudinary",
    "@nuxt/image",
    "@nuxt/icon",
    "@pinia/nuxt",
    "@nuxt/devtools",
    "@hebilicious/vue-query-nuxt"
  ],

  // Vue Query Configuration (simple config, advanced config in vue-query.config.ts)
  vueQuery: {
    queryClientOptions: {
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          refetchOnMount: true,
          throwOnError: false,
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
          throwOnError: false,
        }
      }
    }
  },

  // Nitro configuration for caching and performance
  nitro: {
    // Fix pour erreur client.manifest.mjs avec @nuxt/icon - SUPPRIMÉ selon recommandations multi-agents
    // noExternal: ['@nuxt/icon'],

    // Preset Netlify pour déploiement avec génération statique
    preset: 'netlify',

    routeRules: {
      // Static pages - cache 1 hour
      "/": {
        prerender: false,
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400",
        },
      },
      "/demo/**": {
        headers: {
          "Cache-Control":
            "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
        },
      },

      // API routes caching
      "/api/products/**": {
        cors: true,
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
          Vary: "Accept-Encoding",
        },
      },
      "/api/realisations/**": {
        cors: true,
        headers: {
          "Cache-Control":
            "public, max-age=900, s-maxage=1800, stale-while-revalidate=86400",
          Vary: "Accept-Encoding",
        },
      },
      "/api/contacts": {
        cors: true,
        headers: { "Cache-Control": "no-store" },
      },

      // Assets caching (handled by Vercel but added as fallback)
      "/_nuxt/**": {
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      },

      // DevTools meta files - évite les 404 en développement
      "/_nuxt/builds/meta/**": {
        headers: { "Cache-Control": "no-cache" },
      },

      // Sitemap
      "/sitemap.xml": {
        headers: { "Cache-Control": "public, max-age=86400" },
      },
    },

    // Storage pour le cache
    storage: {
      cache: {
        driver: "memory",
      },
    },

    // Compression
    compressPublicAssets: true,
  },

  // Configuration critique pour l'hydratation selon Perplexity
  experimental: {
    payloadExtraction: false, // Désactive extraction payload si problématique
    inlineSSRStyles: false,   // Évite les conflits CSS inline
    appManifest: false        // Fix pour erreur client.manifest.mjs avec @nuxt/icon
  },

  // Configuration critique pour le debugging
  sourcemap: {
    server: process.env.NODE_ENV === 'development',
    client: process.env.NODE_ENV === 'development'
  },

  // Fix pour les erreurs de développement
  vite: {
    clearScreen: false,
    logLevel: 'info'
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  },

  // Configuration Cloudinary via @nuxtjs/cloudinary et @nuxt/image
  image: {
    cloudinary: {
      baseURL: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`,
    },
    presets: {
      productCard: {
        modifiers: {
          format: "auto",
          quality: "auto:good",
          width: 400,
          height: 300,
          fit: "cover",
        },
      },
      realisationHero: {
        modifiers: {
          format: "auto",
          quality: "auto:good",
          width: 800,
          height: 600,
          fit: "cover",
        },
      },
      realisationFull: {
        modifiers: {
          format: "auto",
          quality: "auto:best",
          width: 1200,
          height: 1200,
          fit: "inside",
        },
      },
      thumbnail: {
        modifiers: {
          format: "auto",
          quality: "auto:eco",
          width: 150,
          height: 150,
          fit: "cover",
        },
      },
    },
  },

  // App configuration
  app: {
    head: {
      title: "NS2PO Election MVP",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Plateforme électorale numérique NS2PO",
        },
      ],
    },
  },
});
