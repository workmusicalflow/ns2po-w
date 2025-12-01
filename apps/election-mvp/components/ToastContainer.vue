<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['toast', `toast-${notification.type}`]"
        role="alert"
        :aria-live="notification.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="toast-content">
          <!-- Icon -->
          <div class="toast-icon">
            <svg v-if="notification.type === 'success'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="notification.type === 'error'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else-if="notification.type === 'warning'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Content -->
          <div class="toast-text">
            <p class="toast-title">
              {{ notification.title }}
            </p>
            <p v-if="notification.message" class="toast-message">
              {{ notification.message }}
            </p>
          </div>

          <!-- Close button -->
          <button
            class="toast-close"
            :aria-label="`Fermer notification ${notification.title}`"
            @click="removeNotification(notification.id)"
          >
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Action button (optionnel) -->
        <button
          v-if="notification.action"
          class="toast-action"
          @click="notification.action.onClick"
        >
          {{ notification.action.label }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { globalNotifications } from '~/composables/useNotifications'

// Utiliser l'instance globale pour accéder aux notifications
const notifications = globalNotifications.notifications
const removeNotification = globalNotifications.removeNotification
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 420px;
}

.toast {
  pointer-events: auto;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border-left: 4px solid;
}

.toast-success {
  border-left-color: #10b981;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-content {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  padding: 1rem;
}

.toast-icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-success .toast-icon {
  background: #d1fae5;
  color: #065f46;
}

.toast-error .toast-icon {
  background: #fee2e2;
  color: #991b1b;
}

.toast-warning .toast-icon {
  background: #fef3c7;
  color: #92400e;
}

.toast-info .toast-icon {
  background: #dbeafe;
  color: #1e40af;
}

.icon {
  width: 1rem;
  height: 1rem;
}

.icon-sm {
  width: 0.875rem;
  height: 0.875rem;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.25rem;
}

.toast-message {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  line-height: 1.125rem;
}

.toast-close {
  flex-shrink: 0;
  padding: 0.25rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.toast-action {
  margin: 0 1rem 1rem 3.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.15s;
}

.toast-action:hover {
  background: #dbeafe;
}

/* Transitions */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .toast-container {
    top: auto;
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
  }

  .toast-list {
    max-width: 100%;
  }

  .toast-content {
    padding: 0.875rem;
  }

  .toast-action {
    margin: 0 0.875rem 0.875rem 2.875rem;
  }
}
</style>
