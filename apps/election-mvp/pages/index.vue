<template>
  <div class="bg-background">
    <!-- Hero Video Section -->
    <section class="hero-section">
      <div class="hero-video-container">
        <video
          class="hero-video"
          autoplay
          loop
          muted
          playsinline
          preload="auto"
        >
          <source
            src="https://res.cloudinary.com/dsrvzogof/video/upload/v1756023631/Multicoloured_Circle_xpo90b.mp4"
            type="video/mp4"
          >
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
        <div class="hero-overlay" />
      </div>
      <div class="hero-content">
        <h1 class="hero-title font-heading">
          <span class="line-reveal">Votre Campagne Électorale</span>
        </h1>
        <p class="hero-subtitle font-body">
          Budget et création de visuels gratuits
        </p>

        <!-- Intégration des drapeaux des pays d'opération -->
        <div class="flags-contextual">
          <FlagsDisplay />
        </div>

        <Button size="large" class="hero-cta" @click="navigateTo('/devis')">
          Créer un devis
        </Button>
      </div>

      <!-- Team Photos - positioned at bottom right -->
      <TeamPhotos
        position="hero"
        :animation-enabled="true"
        message="Une équipe dédiée à votre réussite"
        message-position="left"
      />
    </section>

    <!-- Services Cards -->
    <div class="container mx-auto px-4 py-16">
      <!-- Section Nos Réalisations Phares -->
      <div class="mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-text-main mb-4">
            Nos Réalisations Phares
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez nos créations réalisées pour des campagnes électorales et
            inspirez-vous pour votre projet
          </p>
        </div>

        <!-- Grille des réalisations en vedette -->
        <div
          v-if="featuredRealisations?.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <RealisationCard
            v-for="realisation in featuredRealisations"
            :key="realisation.id"
            :realisation="realisation"
            @inspire="handleInspiration"
            @view-details="handleViewDetails"
            @select="handleSelectRealisation"
          />
        </div>

        <!-- État de chargement -->
        <div v-else-if="realisationsLoading" class="flex justify-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          />
        </div>

        <!-- Bouton pour voir toutes les réalisations -->
        <div class="text-center">
          <Button
            variant="outline"
            class="px-8"
            @click="navigateTo('/realisations')"
          >
            Voir toutes nos réalisations
            <svg
              class="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Button>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="text-center">
        <Card variant="primary" class="max-w-4xl mx-auto">
          <div class="py-8">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Créez votre devis personnalisé
            </h2>
            <p class="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
              Sélectionnez vos produits, uploadez votre logo et obtenez un devis
              instantané
            </p>
            <!-- CTA Buttons Mobile-First: Stack vertical par défaut, horizontal sur tablet+ -->
            <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <Button
                size="large"
                class="w-full sm:w-auto cta-primary min-h-[48px]"
                @click="navigateTo('/devis')"
              >
                Commencer
              </Button>
              <Button
                variant="outline"
                size="large"
                class="w-full sm:w-auto cta-secondary min-h-[48px]"
                @click="navigateTo('/contacts')"
              >
                Nous contacter
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Card, TeamPhotos } from "@ns2po/ui";
import FlagsDisplay from "~/components/FlagsDisplay.vue";
import type { Realisation } from "@ns2po/types";

// Gestion des réalisations
const {
  featured: featuredRealisations,
  loading: realisationsLoading,
  fetchRealisations,
} = useRealisations();

// Chargement initial des réalisations
onMounted(async () => {
  await fetchRealisations();

  // Initialisation des animations GSAP après le montage
  initHeroAnimations();
});

// Gestionnaires d'événements pour les réalisations
const handleInspiration = (realisation: Realisation) => {
  // Redirection vers devis avec contexte d'inspiration (catalogue sera disponible en Mars 2025)
  const productId = realisation.productIds[0];
  if (productId) {
    navigateTo(`/devis-new?inspiredBy=${realisation.id}&product=${productId}`);
  } else {
    navigateTo(`/devis-new?inspiredBy=${realisation.id}`);
  }
};

const handleViewDetails = (realisation: Realisation) => {
  navigateTo(`/realisations/${realisation.id}`);
};

const handleSelectRealisation = (realisation: Realisation) => {
  handleViewDetails(realisation);
};

// Animations GSAP Hero
const initHeroAnimations = () => {
  if (!process.client) return;

  // Import GSAP dynamiquement côté client
  import("gsap").then(({ gsap }) => {
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      // Initialisation des états
      gsap.set(".hero-content", { opacity: 0, y: 20 });
      gsap.set(".hero-title .line-reveal", { clipPath: "inset(0 0 100% 0)" });
      gsap.set(".hero-subtitle", { opacity: 0, y: 20 });
      gsap.set(".hero-cta", { opacity: 0, y: 20 });

      // Timeline d'introduction optimisée pour le ratio 2.85:1
      const heroTimeline = gsap.timeline({
        delay: 0.3, // Réduit de 0.5 à 0.3
        defaults: {
          ease: "power3.out",
          duration: 0.8, // Réduit de 1 à 0.8 pour un rythme plus rapide
        },
      });

      heroTimeline
        .to(".hero-content", { opacity: 1, y: 0, duration: 0.6 }, 0)
        .to(
          ".hero-title .line-reveal",
          { clipPath: "inset(0 0 0% 0)", duration: 1 }, // Réduit de 1.2 à 1
          "<0.15" // Réduit de 0.2 à 0.15
        )
        .to(".hero-subtitle", { opacity: 1, y: 0, duration: 0.7 }, "<0.3") // Réduit de 0.9 à 0.7
        .to(".hero-cta", { opacity: 1, y: 0, duration: 0.6 }, "<0.25"); // Réduit de 0.8 à 0.6

      // Effet de parallaxe léger adapté au ratio 2.85:1
      // Ajuste le déplacement selon la taille d'écran
      const isMobile = window.innerWidth <= 768;
      gsap.to(".hero-content", {
        yPercent: isMobile ? -8 : -15, // Réduit sur mobile pour rester centré
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 1.2, // Légèrement plus doux
        },
      });

      // Parallaxe vidéo subtile adaptée
      gsap.to(".hero-video", {
        yPercent: 8, // Augmenté pour plus de mouvement visible
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 1.5, // Plus fluide
        },
      });

      // Animation d'échelle subtile sur la vidéo au scroll
      gsap.to(".hero-video", {
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 2, // Très doux
        },
      });
    });
  });
};

useHead({
  title: "NS2PO Élections - Gadgets personnalisés pour campagnes politiques",
  meta: [
    {
      name: "description",
      content:
        "Plateforme ivoirienne de devis et commande de gadgets personnalisés pour campagnes électorales. Textiles, goodies, EPI avec impression de logos. Découvrez nos réalisations inspirantes.",
    },
  ],
});
</script>

<style scoped>
/* Hero Video Section - Mobile-First Optimisé */
.hero-section {
  position: relative;
  width: 100%;
  /* Mobile-first: min-height au lieu de ratio forcé */
  min-height: 60vh;
  max-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Ratio 2.85:1 forcé par le conteneur parent */
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(106, 43, 58, 0.4) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

.hero-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
  max-width: 900px;
  padding: 0 20px;
  width: 100%;
}

.hero-title {
  /* Typography scale optimisée mobile-first avec clamp() */
  font-size: clamp(1.75rem, 1.5rem + 4vw, 4rem);
  font-weight: 800;
  color: rgb(var(--color-primary));
  margin-bottom: clamp(0.75rem, 2vw, 1.5rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow: hidden;
}

.hero-title .line-reveal {
  display: block;
  clip-path: inset(0 0 100% 0);
}

.hero-subtitle {
  /* Subtitle optimisée avec clamp() - lisibilité mobile prioritaire */
  font-size: clamp(1rem, 1rem + 1.5vw, 1.5rem);
  font-weight: 400;
  color: rgba(240, 240, 240, 0.95);
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  line-height: 1.4;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
}

/* CTA Button optimisé mobile-first - Standard 2024 */
button.btn.hero-cta {
  background-color: rgb(var(--color-accent)) !important;
  color: #f0f0f0 !important;
  border: none !important;
  /* Standard accessibilité mobile : 48px min-height */
  min-height: 48px;
  padding: clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem);
  font-size: clamp(0.95rem, 1.5vw, 1.1rem);
  font-weight: 600;
  border-radius: 8px;
  margin-top: clamp(0.5rem, 2vw, 1rem);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

button.btn.hero-cta:hover,
button.btn.hero-cta:focus {
  background-color: rgb(var(--color-primary)) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

button.btn.hero-cta:active {
  transform: translateY(0);
}

/* Drapeaux contextuels - Intégration selon plan Gemini */
.flags-contextual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
  animation: flagsInScale 1.5s ease-out forwards;
  animation-delay: 2.2s; /* Après le CTA */
  opacity: 0;
}

.flags-contextual-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-weight: 400;
  white-space: nowrap;
  font-family: var(--font-body);
}

/* Animation d'entrée pour les drapeaux */
@keyframes flagsInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Tablettes - Approche simplifiée mobile-first */
@media (min-width: 768px) {
  .hero-section {
    min-height: 70vh;
    max-height: 90vh;
  }

  .hero-content {
    padding: 0 2rem;
    max-width: 1000px;
  }

  /* Drapeaux sur tablettes */
  .flags-contextual {
    flex-direction: row;
    gap: 1rem;
    margin: 2rem 0;
  }

  .flags-contextual-label {
    font-size: 1.1rem;
  }
}

/* Desktop - Optimisation finale */
@media (min-width: 1024px) {
  .hero-section {
    min-height: 80vh;
  }

  .hero-content {
    padding: 0 3rem;
    max-width: 1200px;
  }

  .flags-contextual {
    margin: 2.5rem 0;
  }
}

/* CTA Section Buttons - Mobile-First Optimisés */
.cta-primary {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.cta-primary:hover,
.cta-primary:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.cta-secondary {
  font-weight: 500;
  transition: all 0.2s ease;
}

.cta-secondary:hover,
.cta-secondary:focus {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Amélioration tactile mobile */
@media (hover: none) {
  .cta-primary:active {
    transform: scale(0.98);
  }

  .cta-secondary:active {
    transform: scale(0.98);
  }
}

</style>
