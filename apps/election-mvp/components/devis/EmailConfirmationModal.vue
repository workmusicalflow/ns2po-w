<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <!-- Header avec icône de succès email -->
      <div class="modal-header">
        <div class="status-icon success">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="modal-title">
          Devis envoyé par email !
        </h3>
      </div>

      <!-- Message principal -->
      <div class="modal-body">
        <p class="modal-message">
          Votre demande de devis a été envoyée avec succès par email à notre équipe commerciale.
        </p>

        <!-- Référence de suivi -->
        <div v-if="reference" class="reference-section">
          <h4 class="reference-title">
            📋 Référence de suivi
          </h4>
          <div class="reference-box">
            <code class="reference-code">{{ reference }}</code>
            <button
              class="copy-btn"
              :disabled="copied"
              @click="copyReference"
            >
              <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ copied ? 'Copié' : 'Copier' }}
            </button>
          </div>
        </div>

        <!-- Étapes suivantes -->
        <div class="next-steps-section">
          <h4 class="steps-title">
            🎯 Prochaines étapes
          </h4>
          <ul class="steps-list">
            <li>✅ Votre demande a été enregistrée avec la référence {{ reference }}</li>
            <li>📧 Vous recevrez un email de confirmation dans les prochaines minutes</li>
            <li>📞 Notre équipe commerciale vous contactera sous 24h</li>
            <li>📄 Un devis personnalisé vous sera proposé rapidement</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="action-section">
          <h4 class="action-title">
            📞 Besoin d'assistance ?
          </h4>

          <!-- Option 1: Consulter email -->
          <div class="action-option">
            <span class="option-number">1.</span>
            <div class="option-content">
              <p class="option-label">
                Vérifiez votre boîte email
              </p>
              <p class="option-desc">
                Un email de confirmation a été envoyé
              </p>
              <button
                class="btn btn-secondary"
                @click="openEmailClient"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Ouvrir Email
              </button>
            </div>
          </div>

          <!-- Option 2: Contact direct -->
          <div class="action-option">
            <span class="option-number">2.</span>
            <div class="option-content">
              <p class="option-label">
                Contact direct
              </p>
              <p class="option-desc">
                Appelez notre équipe commerciale
              </p>
              <div class="contact-buttons">
                <a
                  href="tel:+2250777104936"
                  class="btn btn-phone"
                  @click="trackAction('phone_clicked')"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  Appeler
                </a>
                <a
                  href="mailto:commercial@ns2po.ci"
                  class="btn btn-email"
                  @click="trackAction('email_clicked')"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div class="modal-footer">
        <button
          class="btn btn-primary btn-block"
          @click="newQuote"
        >
          Nouveau devis
        </button>
        <button
          class="btn btn-secondary btn-sm"
          @click="emit('close')"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  show: boolean
  reference?: string
  trackingUrl?: string
  customerEmail?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'new-quote'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const copied = ref(false)

// Escape key listener pour fermer le modal
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show) {
    emit('close')
  }
}

// Setup/cleanup des event listeners
watch(() => props.show, (newShow) => {
  if (newShow) {
    document.addEventListener('keydown', handleEscapeKey)
  } else {
    document.removeEventListener('keydown', handleEscapeKey)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})

// Méthodes
const copyReference = async () => {
  if (!props.reference) return

  try {
    await navigator.clipboard.writeText(props.reference)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Erreur copie référence:', error)
  }
}

const openEmailClient = () => {
  // Ouvrir le client email par défaut
  window.location.href = 'mailto:'
  trackAction('email_client_opened')
}

const newQuote = () => {
  emit('new-quote')
  emit('close')
}

const trackAction = (action: string) => {
  // Analytics tracking
  if (process.client && window.gtag) {
    window.gtag('event', 'email_confirmation_action', {
      'action': action,
      'reference': props.reference
    })
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}

.status-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.status-icon.success {
  background: #ecfdf5;
  color: #059669;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-body {
  padding: 1.5rem 2rem;
}

.modal-message {
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.reference-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.reference-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.reference-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.reference-code {
  flex: 1;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  background: #f9fafb;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.copy-btn:disabled {
  color: #059669;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.next-steps-section {
  margin-bottom: 2rem;
}

.steps-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.steps-list li {
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.action-section {
  margin-bottom: 1rem;
}

.action-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1.5rem 0;
}

.action-option {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.option-number {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.option-content {
  flex: 1;
}

.option-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.option-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
}

.contact-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  touch-action: manipulation;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-phone {
  background: #059669;
  color: white;
  flex: 1;
}

.btn-phone:hover {
  background: #047857;
}

.btn-email {
  background: #7c3aed;
  color: white;
  flex: 1;
}

.btn-email:hover {
  background: #6d28d9;
}

.btn-block {
  width: 100%;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

.modal-footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-content {
    margin: 0.5rem;
    border-radius: 0.75rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .contact-buttons {
    flex-direction: column;
  }
}
</style>