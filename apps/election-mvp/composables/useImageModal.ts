import { onMounted, onUnmounted, computed } from "vue";

interface ImageModalState {
  isOpen: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  realisationTitle?: string;
}

export const useImageModal = () => {
  const state = useState<ImageModalState>("imageModal", () => ({
    isOpen: false,
    imageUrl: null,
    imageAlt: null,
    realisationTitle: undefined,
  }));

  const openModal = (
    imageUrl: string,
    imageAlt: string,
    realisationTitle?: string
  ) => {
    state.value.imageUrl = imageUrl;
    state.value.imageAlt = imageAlt;
    state.value.realisationTitle = realisationTitle;
    state.value.isOpen = true;

    // Bloquer le scroll du body quand le modal est ouvert
    if (process.client) {
      document.body.style.overflow = "hidden";
    }
  };

  const closeModal = () => {
    state.value.isOpen = false;
    state.value.imageUrl = null;
    state.value.imageAlt = null;
    state.value.realisationTitle = undefined;

    // Restaurer le scroll du body
    if (process.client) {
      document.body.style.overflow = "";
    }
  };

  const toggleModal = () => {
    if (state.value.isOpen) {
      closeModal();
    }
  };

  // Gestionnaire pour fermer avec la touche Escape
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && state.value.isOpen) {
      closeModal();
    }
  };

  // Écouter les événements clavier côté client seulement
  if (process.client) {
    onMounted(() => {
      document.addEventListener("keydown", handleKeydown);
    });

    onUnmounted(() => {
      document.removeEventListener("keydown", handleKeydown);
      // S'assurer que le scroll est restauré au démontage
      document.body.style.overflow = "";
    });
  }

  return {
    // State
    isOpen: computed(() => state.value.isOpen),
    imageUrl: computed(() => state.value.imageUrl),
    imageAlt: computed(() => state.value.imageAlt),
    realisationTitle: computed(() => state.value.realisationTitle),

    // Actions
    openModal,
    closeModal,
    toggleModal,
  };
};
