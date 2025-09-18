<template>
  <teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-4 max-w-sm w-full pointer-events-none">
      <transition-group
        name="notification"
        tag="div"
        class="space-y-4"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
            getNotificationColorClasses(notification.type)
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <Icon
                  :name="getNotificationIcon(notification.type)"
                  :class="[
                    'w-5 h-5',
                    getNotificationIconColor(notification.type)
                  ]"
                />
              </div>

              <!-- Content -->
              <div class="ml-3 w-0 flex-1">
                <p class="text-sm font-medium text-gray-900">
                  {{ notification.title }}
                </p>
                <p
                  v-if="notification.message"
                  class="mt-1 text-sm text-gray-500 break-words"
                >
                  {{ notification.message }}
                </p>

                <!-- Action button -->
                <div v-if="notification.action" class="mt-3">
                  <button
                    @click="notification.action.onClick"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    {{ notification.action.label }}
                  </button>
                </div>
              </div>

              <!-- Close button -->
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="removeNotification(notification.id)"
                  class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <span class="sr-only">Fermer</span>
                  <Icon name="heroicons:x-mark" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Progress bar for auto-dismiss -->
            <div
              v-if="!notification.persistent && notification.duration && notification.duration > 0"
              class="mt-3 w-full bg-gray-200 rounded-full h-1"
            >
              <div
                :class="[
                  'h-1 rounded-full transition-all ease-linear',
                  getNotificationProgressColor(notification.type)
                ]"
                :style="{
                  width: '100%',
                  animation: `shrink ${notification.duration}ms linear`
                }"
              ></div>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { globalNotifications } from '~/composables/useNotifications'

const { notifications, removeNotification } = globalNotifications

function getNotificationIcon(type: string): string {
  const icons = {
    success: 'heroicons:check-circle',
    error: 'heroicons:x-circle',
    warning: 'heroicons:exclamation-triangle',
    info: 'heroicons:information-circle'
  }
  return icons[type as keyof typeof icons] || icons.info
}

function getNotificationIconColor(type: string): string {
  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
  }
  return colors[type as keyof typeof colors] || colors.info
}

function getNotificationColorClasses(type: string): string {
  const classes = {
    success: 'border-l-4 border-green-400',
    error: 'border-l-4 border-red-400',
    warning: 'border-l-4 border-amber-400',
    info: 'border-l-4 border-blue-400'
  }
  return classes[type as keyof typeof classes] || classes.info
}

function getNotificationProgressColor(type: string): string {
  const colors = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400'
  }
  return colors[type as keyof typeof colors] || colors.info
}
</script>

<style scoped>
/* Notification animations */
.notification-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Progress bar shrink animation */
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>