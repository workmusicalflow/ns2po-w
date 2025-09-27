/**
 * Endpoint de diagnostic complet Turso + Railway
 * Investigation variables environnement + timing + format
 */
export default defineEventHandler(async (event) => {
  return {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY: !!process.env.RAILWAY_ENVIRONMENT,
      NITRO_PRESET: process.env.NITRO_PRESET,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
      RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
    },
    tursoVariables: {
      // Toutes les variantes possibles
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'NOT_SET',
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '***SET***' : 'NOT_SET',
      NUXT_TURSO_DATABASE_URL: process.env.NUXT_TURSO_DATABASE_URL || 'NOT_SET',
      NUXT_TURSO_AUTH_TOKEN: process.env.NUXT_TURSO_AUTH_TOKEN ? '***SET***' : 'NOT_SET',
      LOCAL_DB: process.env.LOCAL_DB || 'NOT_SET',
    },
    urlFormat: (() => {
      const url = process.env.TURSO_DATABASE_URL;
      if (!url) return { error: 'URL not set' };

      return {
        raw: url.substring(0, 50) + '...',
        isLibsql: url.startsWith('libsql://'),
        hasProtocol: /^libsql:\/\//.test(url),
        length: url.length,
        isValidFormat: /^libsql:\/\/[a-zA-Z0-9\-]+.*\.turso\.io$/.test(url),
        hostname: url.replace('libsql://', '').split('/')[0]
      };
    })(),
    tokenFormat: (() => {
      const token = process.env.TURSO_AUTH_TOKEN;
      if (!token) return { error: 'Token not set' };

      return {
        length: token.length,
        isJWT: /^ey[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]*$/.test(token),
        prefix: token.substring(0, 10),
        hasThreeParts: token.split('.').length === 3
      };
    })(),
    allEnvKeys: Object.keys(process.env).sort(),
    tursoKeys: Object.keys(process.env).filter(key =>
      key.toLowerCase().includes('turso')
    ),
    railwayKeys: Object.keys(process.env).filter(key =>
      key.toLowerCase().includes('railway')
    ),
    runtimeConfig: (() => {
      try {
        const config = useRuntimeConfig();
        return {
          turso: config.turso || null,
          hasCloudinary: !!config.cloudinaryCloudName,
          configKeys: Object.keys(config)
        };
      } catch (e) {
        return { error: e.message };
      }
    })(),
    testConnection: (() => {
      try {
        const { createClient } = require('@libsql/client');
        const url = process.env.TURSO_DATABASE_URL;
        const token = process.env.TURSO_AUTH_TOKEN;

        if (!url || !token) {
          return { canCreate: false, reason: 'Missing variables' };
        }

        // Test création client sans connexion
        const client = createClient({ url, authToken: token });

        return {
          canCreate: true,
          clientType: typeof client,
          clientMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(client))
        };
      } catch (error) {
        return {
          canCreate: false,
          error: error.message,
          reason: 'Client creation failed'
        };
      }
    })()
  };
});