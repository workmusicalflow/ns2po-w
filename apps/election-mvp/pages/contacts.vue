<template>
  <div class="container mx-auto px-4 py-8 md:py-12">
    <!-- 2. Section "Pourquoi NS2PO pour le politique ?" -->
    <section
      class="mb-12 md:mb-16 bg-white rounded-xl shadow-lg p-6 md:p-10 border-t-4 border-accent"
    >
      <h2 class="text-3xl font-heading font-bold text-accent text-center mb-8">
        Pourquoi NS2PO est votre allié pour le secteur politique ?
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
        <div class="p-4">
          <div
            class="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 class="font-heading font-bold text-lg text-text-main mb-2">
            Réactivité Express
          </h3>
          <p class="text-gray-600">
            Réponse sous 24h et production accélérée pour vos urgences de
            campagne
          </p>
        </div>
        <div class="p-4">
          <div
            class="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 class="font-heading font-bold text-lg text-text-main mb-2">
            Expertise Locale
          </h3>
          <p class="text-gray-600">
            13 ans d'expérience sur le marché ivoirien et connaissance des codes
            politiques
          </p>
        </div>
        <div class="p-4">
          <div
            class="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h3 class="font-heading font-bold text-lg text-text-main mb-2">
            Impact Stratégique
          </h3>
          <p class="text-gray-600">
            Conseil en communication visuelle pour maximiser votre visibilité
            électorale
          </p>
        </div>
      </div>
    </section>

    <!-- 3. Formulaire de Contact B2B -->
    <section
      id="formulaire-devis"
      class="mb-12 md:mb-16 bg-white rounded-xl shadow-lg p-6 md:p-10 border-t-4 border-primary"
    >
      <h2
        class="text-3xl font-heading font-bold text-text-main text-center mb-8"
      >
        Décrivez Votre Projet et Obtenez un Devis Rapide
      </h2>
      <p class="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-8">
        Remplissez ce formulaire pour une réponse rapide et un accompagnement
        sur mesure. Nous nous engageons à vous répondre sous
        <strong class="text-primary">24 heures ouvrées</strong>.
      </p>

      <form
        class="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"
        @submit.prevent="submitContactForm"
      >
        <!-- Nom et Prénom -->
        <div>
          <label
            for="firstName"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Prénom *</label>
          <input
            id="firstName"
            v-model="contactForm.firstName"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="Votre prénom"
          >
        </div>
        <div>
          <label
            for="lastName"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Nom *</label>
          <input
            id="lastName"
            v-model="contactForm.lastName"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="Votre nom"
          >
        </div>

        <!-- Organisation et Email -->
        <div>
          <label
            for="organization"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Organisation / Parti Politique *</label>
          <input
            id="organization"
            v-model="contactForm.organization"
            type="text"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="Ex: PDCI, RDR, FPI, Organisation..."
          >
        </div>
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Email *</label>
          <input
            id="email"
            v-model="contactForm.email"
            type="email"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="votre@email.com"
          >
        </div>

        <!-- Téléphone et Type de projet -->
        <div>
          <label
            for="phone"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Téléphone (WhatsApp) *</label>
          <input
            id="phone"
            v-model="contactForm.phone"
            type="tel"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="+225 XX XX XX XX XX"
          >
        </div>
        <div>
          <label
            for="projectType"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Type de Projet *</label>
          <select
            id="projectType"
            v-model="contactForm.projectType"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          >
            <option value="">
              Sélectionnez un type
            </option>
            <option value="campagne-electorale">
              Campagne Électorale
            </option>
            <option value="evenement-politique">
              Événement Politique
            </option>
            <option value="cadeaux-institutionnels">
              Cadeaux Institutionnels
            </option>
            <option value="communication-parti">
              Communication Parti
            </option>
            <option value="autre">
              Autre
            </option>
          </select>
        </div>

        <!-- Message -->
        <div class="md:col-span-2">
          <label
            for="message"
            class="block text-sm font-medium text-gray-700 mb-2"
          >Décrivez votre projet *</label>
          <textarea
            id="message"
            v-model="contactForm.message"
            required
            rows="4"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            placeholder="Décrivez votre projet (produits souhaités, quantités estimées, délais, budget approximatif...)"
          />
        </div>

        <!-- Submit Button -->
        <div class="md:col-span-2 text-center">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white font-bold px-10 py-4 rounded-lg shadow-lg transition-colors duration-300 text-lg"
          >
            <span v-if="!isSubmitting">Envoyer Ma Demande de Devis</span>
            <span v-else>Envoi en cours...</span>
          </button>
        </div>

        <p class="md:col-span-2 text-center text-sm text-gray-500 mt-4">
          Vos données sont traitées en toute confidentialité. Consultez notre
          <NuxtLink
            to="/politique-confidentialite"
            class="text-accent hover:underline"
          >
            Politique de Confidentialité
          </NuxtLink>.
        </p>
      </form>
    </section>

    <!-- 4. Contact Direct & WhatsApp -->
    <section class="mb-12 md:mb-16">
      <h2
        class="text-3xl font-heading font-bold text-text-main text-center mb-8"
      >
        Besoin d'une réponse immédiate ? Contactez-nous directement.
      </h2>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
        />
        <p class="text-gray-600">
          Chargement des contacts...
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div
          class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto"
        >
          <p class="text-red-600 font-medium">
            ❌ Erreur lors du chargement
          </p>
          <p class="text-red-500 text-sm mt-2">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Contact Cards -->
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Contacts depuis la base -->
        <div
          v-for="contact in contacts"
          :key="contact.id"
          class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 border-primary"
        >
          <div class="mb-6">
            <h3 class="font-heading font-bold text-xl text-accent mb-2">
              {{ contact.name }}
            </h3>
            <div class="flex items-center gap-2 mb-2">
              <span
                class="px-3 py-1 rounded-full text-sm font-medium"
                :class="getRoleBadgeClass(contact.role)"
              >
                {{ getRoleLabel(contact.role) }}
              </span>
              <span
                v-if="isContactAvailable(contact)"
                class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
              >
                🟢 Disponible
              </span>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Mobile Phone avec WhatsApp -->
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 p-2 rounded-lg">
                <svg
                  class="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Mobile (WhatsApp)
                </p>
                <div class="flex gap-2">
                  <a
                    :href="getTelLink(contact.mobilePhone)"
                    class="text-accent hover:text-primary font-medium"
                  >
                    {{ formatPhoneNumber(contact.mobilePhone) }}
                  </a>
                  <a
                    :href="getWhatsAppLink(contact.mobilePhone)"
                    target="_blank"
                    class="text-green-600 hover:text-green-700"
                    title="WhatsApp"
                  >
                    📱
                  </a>
                </div>
              </div>
            </div>

            <!-- Fixed Phone (if available) -->
            <div v-if="contact.fixedPhone" class="flex items-center gap-3">
              <div class="bg-primary/10 p-2 rounded-lg">
                <svg
                  class="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Fixe
                </p>
                <a
                  :href="getTelLink(contact.fixedPhone)"
                  class="text-accent hover:text-primary font-medium"
                >
                  {{ formatPhoneNumber(contact.fixedPhone) }}
                </a>
              </div>
            </div>

            <!-- Email (if available) -->
            <div v-if="contact.email" class="flex items-center gap-3">
              <div class="bg-primary/10 p-2 rounded-lg">
                <svg
                  class="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Email
                </p>
                <a
                  :href="getEmailLink(contact.email)"
                  class="text-accent hover:text-primary font-medium break-all"
                >
                  {{ contact.email }}
                </a>
              </div>
            </div>
          </div>

          <!-- Specialties -->
          <div v-if="contact.specialties.length > 0" class="mt-6">
            <p class="text-sm font-medium text-gray-700 mb-2">
              Spécialités
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="specialty in contact.specialties"
                :key="specialty"
                class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {{ specialty }}
              </span>
            </div>
          </div>

          <!-- Availability Hours -->
          <div v-if="hasAvailabilityHours(contact)" class="mt-6">
            <p class="text-sm font-medium text-gray-700 mb-2">
              Horaires
            </p>
            <div class="text-xs text-gray-600 space-y-1">
              <div v-if="contact.availabilityHours.lundi_vendredi">
                <strong>Lun-Ven:</strong>
                {{ contact.availabilityHours.lundi_vendredi }}
              </div>
              <div v-if="contact.availabilityHours.samedi">
                <strong>Samedi:</strong> {{ contact.availabilityHours.samedi }}
              </div>
              <div v-if="contact.availabilityHours.dimanche">
                <strong>Dimanche:</strong>
                {{ contact.availabilityHours.dimanche }}
              </div>
              <div
                v-if="contact.availabilityHours.urgences"
                class="text-red-600"
              >
                <strong>Urgences:</strong>
                {{ contact.availabilityHours.urgences }}
              </div>
            </div>
          </div>
        </div>

        <!-- WhatsApp CTA Card -->
        <div
          class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-t-4 border-green-500 flex flex-col justify-center items-center text-center"
        >
          <h3 class="font-heading font-bold text-xl text-green-700 mb-4">
            Contactez-nous sur WhatsApp
          </h3>
          <p class="text-gray-600 mb-6">
            Pour une réponse rapide et directe, envoyez-nous un message.
          </p>
          <a
            :href="
              priorityContact
                ? getWhatsAppLink(priorityContact.mobilePhone)
                : '#'
            "
            target="_blank"
            class="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12.04 2C7.34 2 3.56 5.78 3.56 10.48c0 1.95.62 3.78 1.68 5.26L3 21.04l5.63-1.48c1.38.79 2.97 1.24 4.41 1.24 4.7 0 8.48-3.78 8.48-8.48S16.74 2 12.04 2zm0 15.5c-1.34 0-2.65-.35-3.79-1.02l-.27-.16-2.76.72.74-2.68-.18-.28c-.73-1.15-1.13-2.48-1.13-3.88 0-3.9 3.18-7.08 7.08-7.08 2.08 0 4.05.81 5.53 2.3s2.3 3.45 2.3 5.53c0 3.9-3.18 7.08-7.08 7.08zm3.6-5.13c-.2-.1-.8-.4-1.16-.53-.35-.14-.6-.1-.86.1-.26.2-.33.2-.5.48-.18.26-.37.5-.55.53-.18.04-.35.02-.66-.12-.3-.14-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.66-2.07-.18-.3-.02-.46.13-.6.12-.11.26-.2.35-.3.09-.1.18-.2.26-.33.08-.14.04-.26-.02-.37-.06-.1-.53-1.28-.73-1.75-.2-.48-.4-.4-.55-.4-.15 0-.32 0-.48.02-.16.02-.42.1-.64.3-.22.2-.84.82-.84 2.02 0 1.2.86 2.34.98 2.5.12.16 1.7 2.6 4.1 3.6 2.4.98 2.9.83 3.43.78.53-.05.8-.33.92-.66.12-.33.12-.6.08-.66-.05-.06-.18-.1-.38-.18z"
              />
            </svg>
            WhatsApp NS2PO
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CommercialContact } from "@ns2po/types";
import { ref, onMounted, reactive, computed } from "vue";

// Page Meta
useHead({
  title: "Contactez NS2PO - Votre partenaire publicité par l'objet",
  meta: [
    {
      name: "description",
      content:
        "Contactez l'équipe commerciale de NS2PO pour vos projets de publicité par l'objet. Devis gratuits, conseils personnalisés et accompagnement expert.",
    },
  ],
});

// Composable
const {
  contacts,
  isLoading,
  error,
  fetchContacts,
  formatPhoneNumber,
  getTelLink,
  getEmailLink,
  isContactAvailable,
  getPriorityContact,
} = useContacts();

// État du formulaire de contact B2B
const contactForm = reactive({
  // Informations personnelles
  firstName: "",
  lastName: "",
  email: "",
  phone: "",

  // Informations professionnelles
  organization: "",
  position: "",

  // Détails du projet politique
  projectType: "",
  eventType: "",
  targetAudience: "",
  budget: "",
  timeline: "",

  // Besoins spécifiques
  products: [] as string[],
  customization: "",
  message: "",

  // Préférences de contact
  preferredContact: "whatsapp",
  urgency: "normal",
});

// États du formulaire
const isSubmitting = ref(false);
const submitSuccess = ref(false);
const submitError = ref<string | null>(null);

// Computed
const priorityContact = computed(() => getPriorityContact());

/**
 * Soumission du formulaire de contact B2B
 */
const submitContactForm = async () => {
  try {
    isSubmitting.value = true;
    submitError.value = null;

    // Validation basique
    if (
      !contactForm.firstName ||
      !contactForm.lastName ||
      !contactForm.email ||
      !contactForm.phone
    ) {
      throw new Error("Les champs obligatoires doivent être renseignés");
    }

    if (
      !contactForm.organization ||
      !contactForm.projectType ||
      !contactForm.message
    ) {
      throw new Error(
        "Veuillez préciser votre organisation, le type de projet et vos besoins"
      );
    }

    // Préparer les données à envoyer
    const formData = {
      ...contactForm,
      submittedAt: new Date().toISOString(),
      source: "contacts-page-b2b-form",
      userAgent: navigator.userAgent,
      referer: document.referrer,
    };

    console.log("📤 Soumission formulaire de contact B2B:", formData);

    // Simulation d'appel API (à implémenter)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("✅ Formulaire soumis avec succès");

    // Succès
    submitSuccess.value = true;

    // Afficher message de succès et rediriger vers WhatsApp
    const priority = getPriorityContact();
    if (priority) {
      setTimeout(() => {
        const whatsappMessage = encodeURIComponent(
          `Bonjour ${priority.name}, je viens de soumettre une demande de devis via votre site. ` +
            `Organisation: ${contactForm.organization} | Type: ${contactForm.projectType}`
        );
        const phoneNumber = priority.mobilePhone.replace(/[\s+]/g, "");
        window.open(
          `https://wa.me/${phoneNumber}?text=${whatsappMessage}`,
          "_blank"
        );
      }, 2000);
    }

    // Réinitialiser le formulaire après un délai
    setTimeout(() => {
      resetForm();
    }, 3000);
  } catch (err) {
    console.error("❌ Erreur soumission formulaire:", err);
    submitError.value =
      err instanceof Error ? err.message : "Une erreur est survenue";
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * Réinitialise le formulaire
 */
const resetForm = () => {
  Object.keys(contactForm).forEach((key) => {
    if (Array.isArray(contactForm[key as keyof typeof contactForm])) {
      (contactForm[key as keyof typeof contactForm] as string[]).length = 0;
    } else {
      (contactForm[key as keyof typeof contactForm] as string) = "";
    }
  });
  contactForm.preferredContact = "whatsapp";
  contactForm.urgency = "normal";
  submitSuccess.value = false;
  submitError.value = null;
};

/**
 * Génère un lien WhatsApp avec message personnalisé
 */
const getWhatsAppLink = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s+]/g, "");
  const message = encodeURIComponent(
    `Bonjour, je souhaite obtenir un devis pour mon projet politique. ` +
      `Organisation: ${contactForm.organization || "À préciser"} | ` +
      `Type de projet: ${contactForm.projectType || "À discuter"}`
  );

  return `https://wa.me/${cleanPhone}?text=${message}`;
};

// Methods pour l'affichage
const getRoleLabel = (role: CommercialContact["role"]): string => {
  const labels = {
    sales: "Commercial",
    manager: "Manager",
    support: "Support",
  };
  return labels[role] || role;
};

const getRoleBadgeClass = (role: CommercialContact["role"]): string => {
  const classes = {
    sales: "bg-primary/10 text-primary",
    manager: "bg-accent/10 text-accent",
    support: "bg-gray-100 text-gray-700",
  };
  return classes[role] || "bg-gray-100 text-gray-700";
};

const hasAvailabilityHours = (contact: CommercialContact): boolean => {
  const hours = contact.availabilityHours;
  return !!(
    hours.lundi_vendredi ||
    hours.samedi ||
    hours.dimanche ||
    hours.urgences
  );
};

// Lifecycle
onMounted(() => {
  fetchContacts();
});
</script>
