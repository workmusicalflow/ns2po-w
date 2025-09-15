import { ref, readonly } from "vue";
import type { CommercialContact } from "@ns2po/types";

/**
 * Composable pour la gestion des contacts commerciaux
 * Utilise l'API Turso pour récupérer les données depuis la table commercial_contacts
 */
export const useContacts = () => {
  // État réactif des contacts
  const contacts = ref<CommercialContact[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Récupère tous les contacts commerciaux actifs
   */
  const fetchContacts = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const data = await $fetch<CommercialContact[]>("/api/contacts");
      contacts.value = data || [];
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des contacts";
      console.error("❌ Erreur useContacts:", err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Trouve un contact par son ID
   */
  const getContactById = (id: string): CommercialContact | undefined => {
    return contacts.value.find((contact) => contact.id === id);
  };

  /**
   * Trouve les contacts par rôle
   */
  const getContactsByRole = (
    role: CommercialContact["role"]
  ): CommercialContact[] => {
    return contacts.value.filter((contact) => contact.role === role);
  };

  /**
   * Trouve les contacts ayant une spécialité donnée
   */
  const getContactsBySpecialty = (specialty: string): CommercialContact[] => {
    return contacts.value.filter((contact) =>
      contact.specialties.some((s) =>
        s.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  };

  /**
   * Formate le numéro de téléphone pour affichage
   */
  const formatPhoneNumber = (phone: string): string => {
    // Format ivoirien standard
    if (phone.startsWith("+225")) {
      return phone.replace(
        /(\+225)(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        "$1 $2 $3 $4 $5 $6"
      );
    }
    return phone;
  };

  /**
   * Génère un lien tel: pour mobile
   */
  const getTelLink = (phone: string): string => {
    return `tel:${phone.replace(/\s/g, "")}`;
  };

  /**
   * Génère un lien mailto
   */
  const getEmailLink = (email: string): string => {
    return `mailto:${email}`;
  };

  /**
   * Vérifie si un contact est disponible maintenant (basique)
   */
  const isContactAvailable = (contact: CommercialContact): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi, etc.

    // Logique basique pour les heures d'ouverture
    if (currentDay >= 1 && currentDay <= 5) {
      // Lundi à vendredi
      return currentHour >= 8 && currentHour < 17;
    } else if (currentDay === 6) {
      // Samedi
      return currentHour >= 8 && currentHour < 12;
    }

    // Dimanche fermé (sauf urgences)
    return false;
  };

  /**
   * Obtient le contact prioritaire selon le contexte
   */
  const getPriorityContact = (): CommercialContact | null => {
    // Prioriser sales actifs, puis manager, puis support
    const salesContacts = getContactsByRole("sales");
    if (salesContacts.length > 0) return salesContacts[0];

    const managerContacts = getContactsByRole("manager");
    if (managerContacts.length > 0) return managerContacts[0];

    const supportContacts = getContactsByRole("support");
    if (supportContacts.length > 0) return supportContacts[0];

    return contacts.value[0] || null;
  };

  return {
    // État
    contacts: readonly(contacts),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    fetchContacts,

    // Getters
    getContactById,
    getContactsByRole,
    getContactsBySpecialty,
    getPriorityContact,

    // Utils
    formatPhoneNumber,
    getTelLink,
    getEmailLink,
    isContactAvailable,
  };
};
