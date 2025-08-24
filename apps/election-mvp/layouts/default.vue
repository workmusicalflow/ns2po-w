<template>
  <div class="min-h-screen bg-white">
    <!-- Navigation Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <nav class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center space-x-3">
            <img
              src="/logos/logo-ns2po.jpg"
              alt="NS2PO - Spécialiste publicité par l'objet"
              class="h-12 w-auto object-contain rounded"
            />
            <span class="text-xl font-bold text-text-main"
              >NS2PO Élections</span
            >
          </NuxtLink>

          <!-- Navigation Menu -->
          <div class="hidden md:flex space-x-8">
            <NuxtLink
              to="/"
              class="text-gray-600 hover:text-primary transition-colors"
              :class="{ 'text-primary font-medium': $route.path === '/' }"
            >
              Accueil
            </NuxtLink>
            <NuxtLink
              to="/catalogue"
              class="text-gray-600 hover:text-primary transition-colors"
              :class="{
                'text-primary font-medium': $route.path === '/catalogue',
              }"
            >
              Catalogue
            </NuxtLink>
            <NuxtLink
              to="/devis"
              class="text-gray-600 hover:text-primary transition-colors"
              :class="{ 'text-primary font-medium': $route.path === '/devis' }"
            >
              Devis
            </NuxtLink>
            <NuxtLink
              to="/contacts"
              class="text-gray-600 hover:text-primary transition-colors"
              :class="{
                'text-primary font-medium': $route.path === '/contacts',
              }"
            >
              Contact
            </NuxtLink>
          </div>

          <!-- CTA Button -->
          <div class="hidden md:block">
            <Button @click="navigateTo('/devis')"> Créer un devis </Button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div
          v-if="mobileMenuOpen"
          class="md:hidden border-t border-gray-200 py-4"
        >
          <div class="space-y-4">
            <NuxtLink
              to="/"
              class="block text-gray-600 hover:text-primary transition-colors"
              :class="{ 'text-primary font-medium': $route.path === '/' }"
              @click="mobileMenuOpen = false"
            >
              Accueil
            </NuxtLink>
            <NuxtLink
              to="/catalogue"
              class="block text-gray-600 hover:text-primary transition-colors"
              :class="{
                'text-primary font-medium': $route.path === '/catalogue',
              }"
              @click="mobileMenuOpen = false"
            >
              Catalogue
            </NuxtLink>
            <NuxtLink
              to="/devis"
              class="block text-gray-600 hover:text-primary transition-colors"
              :class="{ 'text-primary font-medium': $route.path === '/devis' }"
              @click="mobileMenuOpen = false"
            >
              Devis
            </NuxtLink>
            <NuxtLink
              to="/contacts"
              class="block text-gray-600 hover:text-primary transition-colors"
              :class="{
                'text-primary font-medium': $route.path === '/contacts',
              }"
              @click="mobileMenuOpen = false"
            >
              Contact
            </NuxtLink>
            <div class="pt-4">
              <Button
                class="w-full"
                @click="
                  navigateTo('/devis');
                  mobileMenuOpen = false;
                "
              >
                Créer un devis
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div class="md:col-span-2">
            <div class="flex items-center space-x-3 mb-4">
              <img
                src="/logos/logo-ns2po.jpg"
                alt="NS2PO Logo"
                class="h-10 w-auto object-contain rounded"
              />
              <span class="text-xl font-bold">NS2PO</span>
            </div>
            <p class="text-gray-300 mb-4 max-w-md">
              Spécialiste de la publicité par l'objet en Côte d'Ivoire depuis
              2011. Nous accompagnons les acteurs politiques dans leur
              communication visuelle.
            </p>
            <div class="flex space-x-4">
              <a
                href="#"
                class="text-gray-400 hover:text-white transition-colors"
              >
                <span class="sr-only">Facebook</span>
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </a>
              <a
                href="#"
                class="text-gray-400 hover:text-white transition-colors"
              >
                <span class="sr-only">LinkedIn</span>
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink
                  to="/catalogue"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Catalogue produits
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/devis"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Devis en ligne
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/contact"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  Nous contacter
                </NuxtLink>
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-300 hover:text-white transition-colors"
                >
                  À propos
                </a>
              </li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Contact</h3>

            <ul class="space-y-2 text-gray-300">
              <li>📍 Abidjan, Côte d'Ivoire</li>
              <li>📞 +225 XX XX XX XX</li>
              <li>✉️ contact@ns2po.ci</li>
              <li>🕒 Lun-Ven: 8h-17h</li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div
          class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400"
        >
          <p>
            &copy; 2025 NS2PO. Tous droits réservés. | Spécialiste publicité par
            l'objet depuis 2011
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "@ns2po/ui";

// État réactif pour le menu mobile - test hook TypeScript strict enforcer
const mobileMenuOpen = ref(false);

// Fermer le menu mobile lors du changement de route
const route = useRoute();
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  }
);
</script>
