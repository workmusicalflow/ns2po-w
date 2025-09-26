<!--
  TeamPhotos.vue
  Composant d'affichage des photos d'équipe avec animation "gentle pulse"
  Positionné dans la section hero pour humaniser la marque
-->

<template>
  <div
    class="team-photos-container"
    :class="[
      compact ? 'compact' : '',
      position === 'hero' ? 'hero-position' : 'relative-position',
    ]"
  >
    <!-- Message d'accompagnement -->
    <div
      class="team-message"
      :class="messagePosition"
    >
      <span class="message-text">
        {{ message }}
      </span>
    </div>

    <!-- Photos d'équipe avec superposition -->
    <div class="photos-group">
      <div
        v-for="(photo, index) in teamPhotos"
        :key="photo.name"
        class="photo-wrapper"
        :class="`photo-${index + 1}`"
        :style="{
          zIndex: teamPhotos.length - index,
          transform: getPhotoTransform(index),
        }"
      >
        <div class="photo-container">
          <img
            :src="getCurrentPhotoUrl(photo)"
            :alt="`${photo.name} - Équipe NS2PO`"
            class="team-photo"
            loading="lazy"
            @error="handleImageError"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from "vue";

// =====================================
// PROPS & CONFIG
// =====================================

interface TeamPhoto {
  name: string;
  desktop: string;
  mobile: string;
}

interface Props {
  // Comportement
  position?: "hero" | "relative";
  compact?: boolean;
  animationEnabled?: boolean;

  // Style
  messagePosition?: "left" | "above" | "below";
  message?: string;

  // Responsive
  breakpoint?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: "hero",
  compact: false,
  animationEnabled: true,
  messagePosition: "left",
  message: "Une équipe dédiée à votre réussite",
  breakpoint: 768,
});

// =====================================
// DATA & CONFIGURATION
// =====================================

// Configuration Cloudinary
const CLOUDINARY_CONFIG = {
  cloudName: "dsrvzogof",
  baseFolder: "ns2po/team",
  version: "v1756182770",
};

// Photos d'équipe avec génération dynamique des URLs
const teamPhotosData = [
  { name: "isaac-allegbe" },
  { name: "konan" },
  { name: "roxane" },
];

/**
 * Génère une URL Cloudinary optimisée pour une photo d'équipe
 */
const generateCloudinaryUrl = (
  photoName: string,
  size: { width: number; height: number },
): string => {
  const { cloudName, baseFolder, version } = CLOUDINARY_CONFIG;
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_face,h_${size.height},q_auto:good,w_${size.width}/${version}/${baseFolder}/${photoName}.jpg`;
};

// Photos d'équipe avec URLs générées dynamiquement
const teamPhotos: TeamPhoto[] = teamPhotosData.map((photo) => ({
  name: photo.name,
  desktop: generateCloudinaryUrl(photo.name, { width: 80, height: 80 }),
  mobile: generateCloudinaryUrl(photo.name, { width: 60, height: 60 }),
}));

// =====================================
// COMPUTED PROPERTIES
// =====================================

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= props.breakpoint;
});

// =====================================
// METHODS
// =====================================

/**
 * Retourne l'URL appropriée selon la taille d'écran
 */
const getCurrentPhotoUrl = (photo: TeamPhoto): string => {
  return isMobile.value ? photo.mobile : photo.desktop;
};

/**
 * Calcule la transformation CSS pour chaque photo (superposition)
 * Suppression du décalage vertical pour un alignement horizontal parfait
 */
const getPhotoTransform = (index: number): string => {
  // Plus besoin de transform JavaScript car on utilise les margins CSS
  // qui assurent un meilleur alignement
  return "translate(0px, 0px)";
};

/**
 * Gestion d'erreur de chargement d'image
 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn(`Erreur de chargement de l'image: ${img.src}`);

  // Fallback vers une image placeholder ou masquer
  img.style.display = "none";
};

/**
 * Initialisation des animations GSAP
 */
const initGSAPAnimations = () => {
  if (typeof window === 'undefined' || !props.animationEnabled) return;

  // Import GSAP dynamique côté client
  import("gsap")
    .then((gsapModule) => {
      const { gsap } = gsapModule;
      // Animation "gentle pulse" pour chaque photo
      teamPhotos.forEach((_, index) => {
        const photoElement = `.photo-${index + 1} .team-photo`;

        // Animation de respiration douce
        gsap.to(photoElement, {
          scale: 1.05,
          duration: 3,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.5, // Décalage entre chaque photo
        });

        // Animation de lueur subtile sur hover
        gsap.set(photoElement, {
          filter: "brightness(1) saturate(1)",
        });
      });

      // Animation d'entrée pour le message
      gsap.fromTo(
        ".team-message",
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 1.5,
          ease: "power3.out",
        },
      );

      // Animation d'entrée échelonnée pour les photos
      gsap.fromTo(
        ".photo-wrapper",
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          delay: 0.8,
          ease: "back.out(1.4)",
        },
      );

      console.log("🎭 TeamPhotos: Animations GSAP initialisées");
    })
    .catch((error) => {
      console.warn("Erreur lors du chargement de GSAP:", error);
    });
};

// =====================================
// LIFECYCLE
// =====================================

onMounted(() => {
  nextTick(() => {
    if (props.animationEnabled) {
      // Délai pour permettre au DOM de se stabiliser
      setTimeout(() => {
        // Fallback si GSAP ne se charge pas : assure la visibilité des éléments
        setTimeout(() => {
          const teamMessage = document.querySelector('.team-message');
          const photoWrappers = document.querySelectorAll('.photo-wrapper');

          if (teamMessage && getComputedStyle(teamMessage).opacity === '0') {
            (teamMessage as HTMLElement).style.opacity = '1';
          }

          photoWrappers.forEach((wrapper) => {
            if (getComputedStyle(wrapper).opacity === '0') {
              (wrapper as HTMLElement).style.opacity = '1';
            }
          });
        }, 2000); // Fallback après 2 secondes

        initGSAPAnimations();
      }, 500);
    }
  });
});
</script>

<style scoped>
/* =====================================
   LAYOUT PRINCIPAL
   ===================================== */

.team-photos-container {
  @apply flex items-end gap-4;
  position: relative;
}

.team-photos-container.hero-position {
  @apply absolute bottom-4 right-4;
  z-index: 20; /* Au-dessus de la vidéo mais sous le texte hero */
}

.team-photos-container.relative-position {
  @apply relative;
}

.team-photos-container.compact .photos-group {
  transform: scale(0.9);
}

/* =====================================
   MESSAGE D'ACCOMPAGNEMENT
   ===================================== */

.team-message {
  @apply flex items-center;
  opacity: 1; /* Visible par défaut, animé par GSAP si disponible */
}

.team-message.left {
  @apply mr-4;
  order: 1;
}

.team-message.above {
  @apply absolute -top-8 left-0 w-full text-center;
}

.team-message.below {
  @apply absolute -bottom-8 left-0 w-full text-center;
}

.message-text {
  @apply text-white text-sm font-medium;
  font-family: var(--font-family-body);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(8px);
  @apply px-3 py-1.5 rounded-full;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* =====================================
   PHOTOS D'ÉQUIPE
   ===================================== */

/* Groupe de photos - alignement horizontal parfait */
.photos-group {
  @apply relative flex items-center;
  order: 2;
  /* Assure un alignement horizontal strict */
  align-items: center !important;
}

.photo-wrapper {
  @apply relative flex-shrink-0;
  opacity: 1; /* Visible par défaut, animé par GSAP si disponible */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* Assure un alignement de baseline commun */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Gestion de la superposition et du z-index - alignement horizontal strict */
.photo-wrapper.photo-1 {
  z-index: 10;
  /* Micro-rotation très subtile pour préserver l'aspect naturel sans casser l'alignement */
  transform: rotate(-0.5deg);
}

.photo-wrapper.photo-2 {
  @apply -ml-4; /* Chevauchement via margin négatif */
  z-index: 20;
  transform: rotate(0.3deg); /* Rotation minimale */
}

.photo-wrapper.photo-3 {
  @apply -ml-4; /* Chevauchement via margin négatif */
  z-index: 30; /* Photo la plus à droite au-dessus */
  transform: rotate(-0.3deg); /* Rotation minimale */
}

.photo-container {
  @apply relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  padding: 3px; /* Bordure blanche */
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    z-index 0.3s ease;
}

/* Effet au survol optimisé selon recommendations expert */
.photo-wrapper:hover .photo-container {
  transform: translateY(-5px) scale(1.05);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.2);
}

.photo-wrapper:hover {
  z-index: 40 !important; /* Passe au premier plan sur hover */
  transform: translateY(-3px) rotate(0deg) !important; /* Neutralise la rotation sur hover */
}

.team-photo {
  @apply w-full h-full object-cover;
  border-radius: 50%;
  filter: brightness(1.02) saturate(1.1);
  transition: filter 0.3s ease;
}

.team-photo:hover {
  filter: brightness(1.05) saturate(1.15);
}

/* =====================================
   RESPONSIVE DESIGN
   ===================================== */

/* Tablettes - Taille intermédiaire pour transition fluide */
@media (max-width: 768px) and (min-width: 501px) {
  .team-photos-container.hero-position {
    @apply bottom-3 right-3;
  }

  .photo-container {
    width: 65px; /* Taille intermédiaire comme recommandé */
    height: 65px;
    padding: 2px;
  }

  .message-text {
    @apply text-xs px-2 py-1;
  }

  .team-message.left {
    @apply mr-3;
  }

  /* Chevauchement intermédiaire pour tablettes */
  .photo-wrapper.photo-2,
  .photo-wrapper.photo-3 {
    @apply -ml-3;
  }
}

/* Mobiles - Maintien de l'alignement horizontal */
@media (max-width: 500px) {
  .team-photos-container.hero-position {
    @apply bottom-2 right-2 gap-2; /* Garde flex-row, réduit gap */
  }

  .team-message.left {
    @apply mr-2; /* Espacement réduit mais cohérent */
  }

  .photo-container {
    width: 50px;
    height: 50px;
    box-shadow:
      0 3px 10px rgba(0, 0, 0, 0.25),
      0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .message-text {
    @apply text-xs px-2 py-0.5;
    white-space: nowrap;
  }

  /* Ajustement des chevauchements pour mobile */
  .photo-wrapper.photo-2,
  .photo-wrapper.photo-3 {
    @apply -ml-3; /* Chevauchement réduit sur mobile */
  }
}

/* Très petits écrans */
@media (max-width: 375px) {
  .team-photos-container.hero-position {
    @apply bottom-1 right-1;
  }

  .photo-container {
    width: 45px;
    height: 45px;
  }

  /* Chevauchement encore plus réduit sur très petits écrans */
  .photo-wrapper.photo-2,
  .photo-wrapper.photo-3 {
    @apply -ml-2; /* Chevauchement minimal */
  }
}

/* =====================================
   ANIMATIONS & TRANSITIONS
   ===================================== */

.photo-wrapper {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.photos-group:hover .photo-wrapper {
  animation-play-state: paused; /* Pause GSAP animation au hover */
}

/* Animation de brillance au survol du groupe */
@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.photos-group:hover::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shine 1s ease-in-out;
  pointer-events: none;
  border-radius: 50%;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .message-text {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.2) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
</style>
