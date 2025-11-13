/**
 * Debug handler to verify environment variables in Playwright test context
 */
export default defineEventHandler(() => {
  console.log('🔍 [DEBUG-ENV] Handler executed')

  const runtimeConfig = useRuntimeConfig()

  return {
    success: true,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NUXT_TURSO_DATABASE_URL: process.env.NUXT_TURSO_DATABASE_URL,
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '[PRESENT]' : '[MISSING]',
    },
    runtimeConfig: {
      turso: (runtimeConfig as any).turso,
      public: runtimeConfig.public
    },
    processEnvKeys: Object.keys(process.env).filter(k => k.includes('TURSO') || k.includes('NUXT'))
  }
})
