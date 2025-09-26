/**
 * Global notification system composable
 * Provides centralized toast notifications for all admin operations
 */

import { ref, readonly } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: Date
}

// Global reactive state for notifications
const notifications = ref<Notification[]>([])

let notificationIdCounter = 0

function generateNotificationId(): string {
  return `notification_${Date.now()}_${++notificationIdCounter}`
}

export const useNotifications = () => {

  const addNotification = (
    type: Notification['type'],
    title: string,
    options: {
      message?: string
      duration?: number
      persistent?: boolean
      action?: Notification['action']
    } = {}
  ): string => {
    const id = generateNotificationId()
    const notification: Notification = {
      id,
      type,
      title,
      message: options.message,
      duration: options.duration ?? (type === 'error' ? 8000 : 5000),
      persistent: options.persistent ?? false,
      action: options.action,
      createdAt: new Date()
    }

    notifications.value.push(notification)

    // Auto-remove after duration (unless persistent)
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const clearNotificationsByType = (type: Notification['type']) => {
    notifications.value = notifications.value.filter(n => n.type !== type)
  }

  // Convenience methods for common notification types
  const success = (title: string, message?: string, options?: Omit<Parameters<typeof addNotification>[2], 'message'>) => {
    return addNotification('success', title, { ...options, message })
  }

  const error = (title: string, message?: string, options?: Omit<Parameters<typeof addNotification>[2], 'message'>) => {
    return addNotification('error', title, { ...options, message })
  }

  const warning = (title: string, message?: string, options?: Omit<Parameters<typeof addNotification>[2], 'message'>) => {
    return addNotification('warning', title, { ...options, message })
  }

  const info = (title: string, message?: string, options?: Omit<Parameters<typeof addNotification>[2], 'message'>) => {
    return addNotification('info', title, { ...options, message })
  }

  // CRUD-specific helpers with consistent messaging
  const crudSuccess = {
    created: (itemName: string, itemType: string = 'élément') =>
      success('Création réussie', `${itemType} "${itemName}" créé avec succès.`),

    updated: (itemName: string, itemType: string = 'élément') =>
      success('Modification réussie', `${itemType} "${itemName}" modifié avec succès.`),

    deleted: (itemName: string, itemType: string = 'élément') =>
      success('Suppression réussie', `${itemType} "${itemName}" supprimé avec succès.`),

    imported: (count: number, itemType: string = 'éléments') =>
      success('Importation réussie', `${count} ${itemType} importé(s) avec succès.`),

    exported: (count: number, itemType: string = 'éléments') =>
      success('Exportation réussie', `${count} ${itemType} exporté(s) avec succès.`)
  }

  const crudError = {
    created: (itemType: string = 'élément', message?: string) =>
      error('Erreur de création', message || `Impossible de créer le ${itemType}.`),

    updated: (itemType: string = 'élément', message?: string) =>
      error('Erreur de modification', message || `Impossible de modifier le ${itemType}.`),

    deleted: (itemType: string = 'élément', message?: string) =>
      error('Erreur de suppression', message || `Impossible de supprimer le ${itemType}.`),

    loaded: (itemType: string = 'données', message?: string) =>
      error('Erreur de chargement', message || `Impossible de charger les ${itemType}.`),

    validation: (message: string = 'Données invalides') =>
      error('Erreur de validation', message),

    network: (message: string = 'Problème de connexion') =>
      error('Erreur réseau', message),

    permission: (action: string = 'cette action') =>
      error('Accès refusé', `Vous n'avez pas les permissions pour ${action}.`)
  }

  const crudWarning = {
    unsaved: (itemType: string = 'élément') =>
      warning('modifications non sauvées', `Des modifications sur ${itemType} ne sont pas sauvées.`),

    outdated: (itemType: string = 'données') =>
      warning('Données obsolètes', `Les ${itemType} peuvent être obsolètes.`),

    partial: (itemType: string = 'données') =>
      warning('Chargement partiel', `Certaines ${itemType} n'ont pas pu être chargées.`),

    network: (action: string = 'cette opération') =>
      warning('Problème réseau', `${action} pourrait échouer en cas de déconnexion.`),

    validation: (message: string = 'Données à vérifier') =>
      warning('Validation', message)
  }

  // System notifications
  const system = {
    maintenance: (message: string = 'Maintenance en cours...') =>
      warning('Maintenance système', message, { persistent: true }),

    update: (version: string) =>
      info('Mise à jour disponible', `Version ${version} disponible.`, {
        action: {
          label: 'Actualiser',
          onClick: () => window.location.reload()
        }
      }),

    offline: () =>
      warning('Mode hors ligne', 'Connexion internet indisponible.', { persistent: true }),

    online: () =>
      success('Connexion rétablie', 'Vous êtes de nouveau en ligne.')
  }

  return {
    // State
    notifications: readonly(notifications),

    // Core methods
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearNotificationsByType,

    // Convenience methods
    success,
    error,
    warning,
    info,

    // CRUD helpers
    crudSuccess,
    crudError,
    crudWarning,

    // System helpers
    system
  }
}

// Global instance factory (lazy initialization to avoid Pinia SSR issues)
let _globalNotifications: ReturnType<typeof useNotifications> | null = null

export const globalNotifications = {
  get crudError() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.crudError
  },
  get crudSuccess() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.crudSuccess
  },
  get crudWarning() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.crudWarning
  },
  get info() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.info
  },
  get warning() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.warning
  },
  get notifications() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.notifications
  },
  get removeNotification() {
    if (!_globalNotifications) _globalNotifications = useNotifications()
    return _globalNotifications.removeNotification
  }
}