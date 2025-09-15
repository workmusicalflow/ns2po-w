/**
 * Plugin Google Analytics 4 pour NS2PO Election MVP
 * Intégration GA4 avec tracking des interactions réalisations
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gaMeasurementId = config.public.googleAnalyticsId

  // Ne pas charger GA4 en développement ou si pas d'ID configuré
  if (process.dev || !gaMeasurementId) {
    console.info('🔍 GA4 tracking disabled (dev mode or no measurement ID)')
    return
  }

  // Initialisation du dataLayer
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }

    // Configuration initiale
    gtag('js', new Date())
    gtag('config', gaMeasurementId, {
      page_title: 'NS2PO Election MVP',
      page_location: config.public.siteUrl,
      send_page_view: false, // On gère manuellement les pages vues
      custom_map: {
        custom_parameter_1: 'realisation_id',
        custom_parameter_2: 'product_id',
        custom_parameter_3: 'quote_value',
        custom_parameter_4: 'inspiration_source'
      },
      // Respect de la vie privée
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    })

    // Exposition globale de gtag
    window.gtag = gtag

    // Chargement asynchrone du script GA4
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
    document.head.appendChild(script)

    console.info(`✅ GA4 initialized with measurement ID: ${gaMeasurementId}`)
  }
})