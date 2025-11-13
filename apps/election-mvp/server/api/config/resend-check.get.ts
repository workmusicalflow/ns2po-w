/**
 * API Route: Check Resend Configuration
 *
 * GET /api/config/resend-check
 *
 * Vérifie que les variables d'environnement Resend sont accessibles
 * Retourne l'état de configuration sans exposer les valeurs sensibles
 *
 * @module server/api/config/resend-check
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()

    // Vérifier présence des variables Resend
    const resendApiKey = config.resendApiKey
    const resendFromEmail = config.resendFromEmail

    // Masquer les valeurs sensibles pour la réponse
    const apiKeyStatus = resendApiKey
      ? {
          configured: true,
          length: resendApiKey.length,
          prefix: resendApiKey.substring(0, 8) + '...',
          valid: resendApiKey.startsWith('re_'), // Resend keys start with 're_'
        }
      : {
          configured: false,
          error: 'RESEND_API_KEY not set in environment',
        }

    const fromEmailStatus = resendFromEmail
      ? {
          configured: true,
          value: resendFromEmail, // Email can be shown (not sensitive)
        }
      : {
          configured: false,
          error: 'RESEND_FROM_EMAIL not set in environment',
        }

    // Vérifier toutes les variables runtime config liées
    const allRuntimeConfig = {
      resendApiKey: !!config.resendApiKey,
      resendFromEmail: !!config.resendFromEmail,
      chromiumExecutablePath: config.chromiumExecutablePath || 'not set',
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      isRailway: process.env.RAILWAY_ENVIRONMENT !== undefined,
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      resend: {
        apiKey: apiKeyStatus,
        fromEmail: fromEmailStatus,
        readyToSend: apiKeyStatus.configured && fromEmailStatus.configured,
      },
      runtime: allRuntimeConfig,
      message: apiKeyStatus.configured && fromEmailStatus.configured
        ? 'Resend is fully configured and ready'
        : 'Resend configuration incomplete',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }
  }
})
