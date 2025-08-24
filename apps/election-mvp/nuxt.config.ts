export default defineNuxtConfig({
  devtools: { enabled: true },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Désactivé pour éviter oxc-parser en CI, utilise vue-tsc
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
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/cloudinary", "@nuxt/image"],

  // Nitro configuration for caching and performance
  nitro: {
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

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,

    // Configuration pour les images de produits et réalisations
    image: {
      quality: "auto:good",
      format: "auto",
      loading: "lazy",
      responsive: true,
      sizes: "sm:300px md:400px lg:500px",
      placeholder: true,

      // Presets pour différents contextes
      presets: {
        // Cartes produits dans le catalogue
        productCard: {
          modifiers: {
            format: "auto",
            quality: "auto:good",
            width: 400,
            height: 300,
            crop: "fill",
            gravity: "center",
          },
        },

        // Images héroïques des réalisations
        realisationHero: {
          modifiers: {
            format: "auto",
            quality: "auto:good",
            width: 800,
            height: 600,
            crop: "fill",
            gravity: "center",
          },
        },

        // Miniatures pour les galeries
        thumbnail: {
          modifiers: {
            format: "auto",
            quality: "auto:eco",
            width: 150,
            height: 150,
            crop: "fill",
            gravity: "face:center",
          },
        },

        // Images haute résolution pour prévisualisations
        preview: {
          modifiers: {
            format: "auto",
            quality: "auto:best",
            width: 1200,
            height: 900,
            crop: "fit",
            gravity: "center",
          },
        },
      },
    },
  },

  // @nuxt/image configuration
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
