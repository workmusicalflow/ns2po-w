/**
 * Middleware d'authentification admin
 * Protège l'accès aux pages /admin
 */

export default defineNuxtRouteMiddleware((to, from) => {
  // En développement, bypass l'auth pour faciliter le développement
  if (process.env.NODE_ENV === 'development') {
    return
  }

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = checkAdminAuth()

  if (!isAuthenticated) {
    // Rediriger vers la page de login admin
    return navigateTo('/admin/login')
  }
})

/**
 * Vérifie l'authentification admin
 * TODO: Implémenter une vraie vérification avec JWT/session
 */
function checkAdminAuth(): boolean {
  // Pour l'instant, vérification basique
  // En production, vérifier le token JWT/cookie sécurisé

  if (process.server) {
    return false // Sur le serveur, pas d'auth pour l'instant
  }

  // Côté client, vérifier le localStorage/sessionStorage
  try {
    const adminToken = localStorage.getItem('ns2po_admin_token')
    return !!adminToken // Retourne true si le token existe
  } catch {
    return false
  }
}