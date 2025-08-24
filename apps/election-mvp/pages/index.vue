<template>
  <div class="min-h-screen bg-background">
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
          Génération de devis et pré-commande de gadgets personnalisés
        </p>
        <Button size="large" class="hero-cta" @click="navigateTo('/devis')">
          Demander un devis
        </Button>
      </div>
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
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Créez votre devis personnalisé
            </h2>
            <p class="text-lg text-gray-600 mb-8">
              Sélectionnez vos produits, uploadez votre logo et obtenez un devis
              instantané
            </p>
            <div class="space-x-4">
              <Button size="large" @click="navigateTo('/devis')">
                Commencer
              </Button>
              <Button
                variant="outline"
                size="large"
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
import { Button, Card } from "@ns2po/ui";
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
    navigateTo(`/devis?inspiredBy=${realisation.id}&product=${productId}`);
  } else {
    navigateTo(`/devis?inspiredBy=${realisation.id}`);
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
      gsap.to(".hero-content", {
        yPercent: -15, // Augmenté pour compenser la section plus courte
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
/* Hero Video Section */
.hero-section {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: calc(100% / 2.85); /* Force le ratio 2.85:1 */
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
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  color: rgb(var(--color-primary));
  margin-bottom: 15px;
  line-height: 1.2;
  overflow: hidden;
}

.hero-title .line-reveal {
  display: block;
  clip-path: inset(0 0 100% 0);
}

.hero-subtitle {
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 300;
  color: #f0f0f0;
  margin-bottom: 30px;
  line-height: 1.4;
}

.hero-cta {
  background-color: rgb(var(--color-accent)) !important;
  color: #f0f0f0 !important;
  border: none !important;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.hero-cta:hover {
  background-color: rgb(var(--color-primary)) !important;
  transform: translateY(-2px) scale(1.02);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-section {
    /* Maintient le ratio 2.85:1 même sur mobile */
    padding-bottom: calc(100% / 2.85);
    min-height: 50vh; /* Hauteur minimum pour éviter une section trop petite */
  }

  .hero-content {
    padding: 0 15px;
  }

  .hero-title {
    font-size: clamp(2rem, 8vw, 3rem);
  }

  .hero-subtitle {
    font-size: clamp(1rem, 4vw, 1.4rem);
  }
}
</style>
