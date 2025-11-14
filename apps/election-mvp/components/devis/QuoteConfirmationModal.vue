<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <!-- Header avec icône dynamique -->
      <div class="modal-header">
        <div class="status-icon" :class="statusIconClass">
          <svg v-if="whatsappOpened" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="error" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </div>
        <h3 class="modal-title">{{ modalTitle }}</h3>
      </div>

      <!-- Message principal -->
      <div class="modal-body">
        <p class="modal-message">{{ modalMessage }}</p>

        <!-- Options de secours si nécessaire -->
        <div v-if="showFallbackOptions" class="fallback-section">
          <h4 class="fallback-title">📱 Options de contact :</h4>

          <!-- Option 1: WhatsApp manuel -->
          <div class="fallback-option">
            <span class="option-number">1.</span>
            <div class="option-content">
              <p class="option-label">Envoyer manuellement via WhatsApp</p>
              <div class="option-buttons">
                <a
                  :href="whatsappLink"
                  target="_blank"
                  class="btn btn-whatsapp"
                  @click="trackFallbackAction('whatsapp_manual')"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.04 2C7.34 2 3.56 5.78 3.56 10.48c0 1.95.62 3.78 1.68 5.26L3 21.04l5.63-1.48c1.38.79 2.97 1.24 4.41 1.24 4.7 0 8.48-3.78 8.48-8.48S16.74 2 12.04 2zm0 15.5c-1.34 0-2.65-.35-3.79-1.02l-.27-.16-2.76.72.74-2.68-.18-.28c-.73-1.15-1.13-2.48-1.13-3.88 0-3.9 3.18-7.08 7.08-7.08 2.08 0 4.05.81 5.53 2.3s2.3 3.45 2.3 5.53c0 3.9-3.18 7.08-7.08 7.08z"/>
                  </svg>
                  Ouvrir WhatsApp
                </a>
                <a
                  :href="webWhatsappLink"
                  target="_blank"
                  class="btn btn-web-whatsapp"
                  @click="trackFallbackAction('whatsapp_web')"
                >
                  💻 WhatsApp Web
                </a>
              </div>
              <button
                @click="copyMessage"
                class="btn btn-copy"
              >
                📋 Copier le message
              </button>
              <p class="help-text">
                Si WhatsApp ne s'ouvre pas, copiez le message et envoyez-le à : {{ fallbackPhone }}
              </p>
            </div>
          </div>

          <!-- Option 2: Appel direct -->
          <div class="fallback-option">
            <span class="option-number">2.</span>
            <div class="option-content">
              <p class="option-label">Nous appeler directement</p>
              <a
                :href="`tel:${fallbackPhone}`"
                class="btn btn-call"
                @click="trackFallbackAction('phone_call')"
              >
                📞 Appeler {{ fallbackPhone }}
              </a>
            </div>
          </div>

          <!-- Option 3: Email -->
          <div class="fallback-option">
            <span class="option-number">3.</span>
            <div class="option-content">
              <p class="option-label">Nous envoyer un email</p>
              <a
                :href="emailLink"
                class="btn btn-email"
                @click="trackFallbackAction('email')"
              >
                📧 Envoyer un Email
              </a>
            </div>
          </div>
        </div>

        <!-- Message de succès simple si WhatsApp s'est ouvert -->
        <div v-else-if="whatsappOpened" class="success-section">
          <p class="success-message">
            🎉 Parfait ! Votre message de devis a été préparé dans WhatsApp.
            <strong>Appuyez sur "Envoyer"</strong> dans l'application pour finaliser votre demande.
          </p>
          <p class="follow-up-message">
            ⚡ Notre équipe vous recontactera dans les <strong>24h</strong> pour finaliser votre devis personnalisé.
          </p>
        </div>
      </div>

      <!-- Footer avec bouton de fermeture -->
      <div class="modal-footer">
        <button @click="emit('close')" class="btn btn-close">
          {{ whatsappOpened ? 'Parfait, merci !' : 'Fermer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue';

const props = defineProps<{
  show: boolean;
  whatsappOpened: boolean;
  error: string | null;
  fallbackEmail: string;
  fallbackPhone: string;
  whatsappLink: string;
  webWhatsappLink?: string;
  rawMessage?: string; // Message non encodé pour copie
}>();

const emit = defineEmits<{
  close: []
}>();

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

// Computed properties pour l'UI dynamique
const modalTitle = computed(() => {
  if (props.error) return '⚠️ Action requise';
  if (props.whatsappOpened) return '✅ Devis prêt !';
  return '📱 Finaliser l\'envoi';
});

const modalMessage = computed(() => {
  if (props.error) {
    return `${props.error} Veuillez utiliser une des options ci-dessous pour nous contacter.`;
  }
  if (props.whatsappOpened) {
    return '';
  }
  return 'WhatsApp ne s\'est pas ouvert automatiquement. Choisissez une option ci-dessous :';
});

const statusIconClass = computed(() => {
  if (props.whatsappOpened) return 'status-success';
  if (props.error) return 'status-error';
  return 'status-info';
});

const showFallbackOptions = computed(() =>
  !props.whatsappOpened || !!props.error
);

const emailLink = computed(() => {
  const subject = encodeURIComponent('Demande de Devis Électoral - NS2PO');
  const body = encodeURIComponent(
    `Bonjour,\n\nJe souhaite obtenir un devis pour mon projet électoral.\n\n` +
    `Vous trouverez ci-dessous les détails de ma demande :\n\n` +
    `${props.rawMessage || 'Détails à préciser lors de notre échange.'}\n\n` +
    `Merci de me recontacter rapidement.\n\nCordialement`
  );
  return `mailto:${props.fallbackEmail}?subject=${subject}&body=${body}`;
});

// Méthodes
const copyMessage = async () => {
  try {
    const messageToCopy = props.rawMessage || decodeURIComponent(
      props.whatsappLink.split('?text=')[1] || ''
    );

    await navigator.clipboard.writeText(messageToCopy);

    // Feedback visuel
    const button = event?.target as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✅ Copié !';
      button.classList.add('btn-copied');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('btn-copied');
      }, 2000);
    }

    trackFallbackAction('message_copied');
  } catch (err) {
    console.error('Impossible de copier le texte:', err);
    alert('Impossible de copier automatiquement. Veuillez sélectionner et copier le message manuellement.');
  }
};

const trackFallbackAction = (action: string) => {
  if (process.client && window.gtag) {
    window.gtag('event', 'quote_fallback_action', {
      'action': action,
      'had_whatsapp_error': !!props.error,
      'whatsapp_opened': props.whatsappOpened
    });
  }
  console.log(`Fallback action: ${action}`);
};
</script>

<style scoped>
/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 90%;
  width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.modal-header {
  text-align: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.status-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.status-success {
  background: #10B981;
  color: white;
}

.status-error {
  background: #EF4444;
  color: white;
}

.status-info {
  background: #3B82F6;
  color: white;
}

.modal-title {
  color: #1F2937;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

/* Body */
.modal-body {
  padding: 24px;
}

.modal-message {
  color: #4B5563;
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 1rem;
}

/* Success section */
.success-section {
  text-align: center;
  padding: 16px;
  background: #F0FDF4;
  border-radius: 12px;
  border: 1px solid #BBF7D0;
}

.success-message {
  color: #065F46;
  font-size: 1.1rem;
  margin-bottom: 12px;
  line-height: 1.5;
}

.follow-up-message {
  color: #047857;
  font-size: 0.95rem;
  margin: 0;
}

/* Fallback section */
.fallback-section {
  margin-top: 20px;
}

.fallback-title {
  color: #374151;
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: 600;
}

.fallback-option {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.option-number {
  background: #3B82F6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.option-content {
  flex: 1;
}

.option-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.option-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  touch-action: manipulation;
}

.btn-whatsapp {
  background: #25D366;
  color: white;
}

.btn-whatsapp:hover {
  background: #1DA851;
  transform: translateY(-1px);
}

.btn-web-whatsapp {
  background: #075E54;
  color: white;
}

.btn-web-whatsapp:hover {
  background: #064E45;
  transform: translateY(-1px);
}

.btn-copy {
  background: #3B82F6;
  color: white;
  margin-top: 4px;
}

.btn-copy:hover {
  background: #2563EB;
  transform: translateY(-1px);
}

.btn-copied {
  background: #10B981 !important;
}

.btn-call {
  background: #F59E0B;
  color: white;
}

.btn-call:hover {
  background: #D97706;
  transform: translateY(-1px);
}

.btn-email {
  background: #6366F1;
  color: white;
}

.btn-email:hover {
  background: #4F46E5;
  transform: translateY(-1px);
}

.btn-close {
  background: #6B7280;
  color: white;
  width: 100%;
}

.btn-close:hover {
  background: #4B5563;
}

.help-text {
  font-size: 0.8rem;
  color: #6B7280;
  margin-top: 8px;
  line-height: 1.4;
}

/* Footer */
.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #F0F0F0;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal-content {
    width: 100%;
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px 20px 16px;
  }

  .modal-body {
    padding: 20px;
  }

  .option-buttons {
    flex-direction: column;
  }

  .btn {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
}

/* Animations pour mobile (smooth) */
@media (hover: none) {
  .btn:active {
    transform: scale(0.95);
  }
}
</style>