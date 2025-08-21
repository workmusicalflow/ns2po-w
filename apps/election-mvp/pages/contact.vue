<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Contactez-nous
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Notre équipe est à votre écoute pour répondre à vos questions 
          et vous accompagner dans votre projet de communication politique
        </p>
      </div>

      <!-- Contact Methods Quick Access -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card class="text-center p-6 hover:shadow-lg transition-shadow">
          <div class="text-blue-600 text-3xl mb-4">📞</div>
          <h3 class="font-semibold mb-2">Appelez-nous</h3>
          <p class="text-gray-600 text-sm mb-3">Réponse immédiate</p>
          <a href="tel:+22507XXXXXX" class="text-blue-600 font-medium">+225 07 XX XX XX XX</a>
        </Card>
        
        <Card class="text-center p-6 hover:shadow-lg transition-shadow">
          <div class="text-green-600 text-3xl mb-4">💬</div>
          <h3 class="font-semibold mb-2">WhatsApp</h3>
          <p class="text-gray-600 text-sm mb-3">Discussion rapide</p>
          <a href="https://wa.me/22507XXXXXX" class="text-green-600 font-medium" target="_blank">Discuter maintenant</a>
        </Card>
        
        <Card class="text-center p-6 hover:shadow-lg transition-shadow">
          <div class="text-red-600 text-3xl mb-4">🚨</div>
          <h3 class="font-semibold mb-2">Urgence</h3>
          <p class="text-gray-600 text-sm mb-3">Commande express</p>
          <a href="tel:+22507XXXXXX" class="text-red-600 font-medium">+225 07 XX XX XX XX</a>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <!-- Formulaire de contact principal -->
        <div class="lg:col-span-2">
          <ContactForm @submitted="onFormSubmitted" />
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Coordonnées -->
          <Card>
            <template #header>
              <h2 class="text-xl font-semibold">Nos coordonnées</h2>
            </template>
            
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <div class="text-blue-600 text-xl">📍</div>
                <div>
                  <h3 class="font-medium">Adresse</h3>
                  <p class="text-gray-600">
                    Zone 4, Rue K55<br>
                    Marcory - Abidjan<br>
                    Côte d'Ivoire
                  </p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="text-blue-600 text-xl">📞</div>
                <div>
                  <h3 class="font-medium">Téléphone</h3>
                  <p class="text-gray-600">+225 07 XX XX XX XX</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="text-blue-600 text-xl">✉️</div>
                <div>
                  <h3 class="font-medium">Email</h3>
                  <p class="text-gray-600">contact@ns2po.ci</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="text-blue-600 text-xl">🕒</div>
                <div>
                  <h3 class="font-medium">Horaires</h3>
                  <p class="text-gray-600">
                    Lundi - Vendredi: 8h - 17h<br>
                    Samedi: 8h - 12h<br>
                    Dimanche: Fermé
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <!-- Services -->
          <Card variant="primary">
            <template #header>
              <h2 class="text-xl font-semibold text-white">Nos garanties</h2>
            </template>
            
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <span class="text-white">✓</span>
                <span class="text-white">Devis gratuit sous 24h</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-white">✓</span>
                <span class="text-white">Conception graphique incluse</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-white">✓</span>
                <span class="text-white">Livraison dans toute la CI</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-white">✓</span>
                <span class="text-white">Support technique dédié</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-white">✓</span>
                <span class="text-white">Produits certifiés qualité</span>
              </div>
            </div>
          </Card>

          <!-- FAQ rapide -->
          <Card>
            <template #header>
              <h2 class="text-xl font-semibold">FAQ Express</h2>
            </template>
            
            <div class="space-y-4">
              <div>
                <h3 class="font-medium text-gray-900">⏱️ Délais de livraison ?</h3>
                <p class="text-sm text-gray-600">7 à 14 jours ouvrés selon quantité</p>
              </div>
              
              <div>
                <h3 class="font-medium text-gray-900">📦 Quantité minimum ?</h3>
                <p class="text-sm text-gray-600">25 à 50 pièces selon le produit</p>
              </div>
              
              <div>
                <h3 class="font-medium text-gray-900">🎨 Formats acceptés ?</h3>
                <p class="text-sm text-gray-600">PNG, JPG, SVG, AI, EPS HD</p>
              </div>
              
              <div>
                <h3 class="font-medium text-gray-900">💰 Mode de paiement ?</h3>
                <p class="text-sm text-gray-600">Mobile Money, Virement, Espèces</p>
              </div>
            </div>
          </Card>

          <!-- Testimonials -->
          <Card>
            <template #header>
              <h2 class="text-xl font-semibold">Ils nous font confiance</h2>
            </template>
            
            <div class="space-y-4">
              <div class="border-l-4 border-blue-500 pl-4">
                <p class="text-sm text-gray-600 italic">"Service impeccable, délais respectés!"</p>
                <p class="text-xs text-gray-500 mt-1">- Parti Démocratique, Abidjan</p>
              </div>
              
              <div class="border-l-4 border-green-500 pl-4">
                <p class="text-sm text-gray-600 italic">"Qualité exceptionnelle, prix compétitifs"</p>
                <p class="text-xs text-gray-500 mt-1">- Alliance Politique, Bouaké</p>
              </div>
              
              <div class="border-l-4 border-orange-500 pl-4">
                <p class="text-sm text-gray-600 italic">"Équipe professionnelle et réactive"</p>
                <p class="text-xs text-gray-500 mt-1">- Candidat Indépendant, San Pedro</p>
              </div>
            </div>
          </Card>

          <!-- Partners -->
          <Card>
            <template #header>
              <h2 class="text-xl font-semibold">Nos partenaires</h2>
            </template>
            
            <div class="grid grid-cols-2 gap-4 text-center">
              <div class="p-4 bg-gray-50 rounded">
                <div class="text-2xl mb-2">🏢</div>
                <p class="text-xs text-gray-600">Imprimerie Moderne</p>
              </div>
              <div class="p-4 bg-gray-50 rounded">
                <div class="text-2xl mb-2">🚚</div>
                <p class="text-xs text-gray-600">Livraison Express</p>
              </div>
              <div class="p-4 bg-gray-50 rounded">
                <div class="text-2xl mb-2">✅</div>
                <p class="text-xs text-gray-600">Certification ISO</p>
              </div>
              <div class="p-4 bg-gray-50 rounded">
                <div class="text-2xl mb-2">🎨</div>
                <p class="text-xs text-gray-600">Studio Créatif</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from '@ns2po/ui'
import ContactForm from '../components/ContactForm.vue'
import type { ContactSubmissionResponse } from '@ns2po/types'

useHead({
  title: 'Contact - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Contactez NS2PO pour vos projets de gadgets personnalisés pour campagnes électorales en Côte d\'Ivoire. Devis gratuit sous 24h.'
    },
    {
      name: 'keywords',
      content: 'contact NS2PO, devis gratuit, gadgets personnalisés, élections Côte d\'Ivoire, objets publicitaires'
    }
  ]
})

// Success toast notification
const { $toast } = useNuxtApp() as { $toast?: { success: Function; error: Function } }

// Handle form submission success
const onFormSubmitted = (response: ContactSubmissionResponse) => {
  try {
    if (response.success) {
      // Show success message
      const message = response.message || 'Votre message a été envoyé avec succès!'
      
      // Show toast notification if available, otherwise use alert
      if ($toast && typeof $toast.success === 'function') {
        $toast.success(message)
      } else {
        alert(message)
      }

      // Log for analytics
      console.log('Contact form submitted successfully:', {
        contactId: response.contactId,
        timestamp: new Date().toISOString()
      })

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      throw new Error('Erreur lors de l\'envoi')
    }
  } catch (error) {
    console.error('Error handling form submission:', error)
    
    // Show error message
    const errorMessage = 'Erreur lors de l\'envoi du message. Veuillez réessayer.'
    if ($toast && typeof $toast.error === 'function') {
      $toast.error(errorMessage)
    } else {
      alert(errorMessage)
    }
  }
}
</script>