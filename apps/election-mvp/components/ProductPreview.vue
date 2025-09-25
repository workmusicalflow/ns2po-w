<template>
  <div class="product-preview">
    <!-- Configuration de personnalisation -->
    <div class="customization-panel">
      <h3 class="panel-title">
        Personnalisation
      </h3>

      <!-- Gestion des logos multiples -->
      <div class="customization-section">
        <div class="section-header">
          <label class="section-label">Logos</label>
          <CloudinaryUpload
            preset="logo"
            folder="logos"
            button-text="+ Ajouter"
            compact
            @upload:success="addLogo"
            @upload:error="handleUploadError"
          />
        </div>

        <!-- Liste des logos -->
        <div v-if="customization.logos?.length" class="logos-list">
          <div
            v-for="(logo, index) in customization.logos"
            :key="logo.id"
            :class="[
              'logo-item',
              { 'logo-item--selected': selectedLogoIndex === index },
            ]"
            @click="selectLogo(index)"
          >
            <img
              :src="logo.url"
              :alt="`Logo ${index + 1}`"
              class="logo-preview"
            >
            <div class="logo-controls">
              <label class="control-label">X: {{ Math.round(logo.x) }}</label>
              <input
                type="range"
                :value="logo.x"
                min="0"
                :max="canvasWidth - logo.width"
                class="control-slider"
                @input="updateLogo(index, { x: Number(($event.target as HTMLInputElement).value) })"
              >

              <label class="control-label">Y: {{ Math.round(logo.y) }}</label>
              <input
                type="range"
                :value="logo.y"
                min="0"
                :max="canvasHeight - logo.height"
                class="control-slider"
                @input="updateLogo(index, { y: Number(($event.target as HTMLInputElement).value) })"
              >

              <label class="control-label">Taille: {{ Math.round(logo.width) }}</label>
              <input
                type="range"
                :value="logo.width"
                min="20"
                max="200"
                class="control-slider"
                @input="
                  updateLogo(index, {
                    width: Number(($event.target as HTMLInputElement).value),
                    height: Number(($event.target as HTMLInputElement).value),
                  })
                "
              >

              <button
                class="remove-logo-btn"
                title="Supprimer ce logo"
                @click="removeLogo(index)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path
                    fill-rule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Support rétrocompatible pour un logo unique -->
        <div v-else-if="customization.logoUrl">
          <CloudinaryUpload
            preset="logo"
            folder="logos"
            @upload:success="handleLogoUpload"
            @upload:error="handleUploadError"
          />
        </div>

        <!-- Error message -->
        <div v-if="uploadError" class="error-message" role="alert">
          <div class="error-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="error-content">
            <span class="error-title">Erreur</span>
            <span class="error-text">{{ uploadError }}</span>
          </div>
          <button
            class="error-dismiss"
            aria-label="Fermer l'erreur"
            @click="uploadError = null"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Texte personnalisé -->
      <div class="customization-section">
        <label for="customText" class="section-label">Texte personnalisé</label>
        <input
          id="customText"
          v-model="customization.text"
          type="text"
          placeholder="Votre texte ici..."
          class="text-input"
          maxlength="50"
        >
      </div>

      <!-- Position -->
      <div class="customization-section">
        <fieldset>
          <legend class="section-label">
            Position
          </legend>
          <div class="position-grid">
            <button
              v-for="position in availablePositions"
              :key="position.value"
              :class="[
                'position-btn',
                {
                  'position-btn--active':
                    customization.position === position.value,
                },
              ]"
              @click="customization.position = position.value"
            >
              <div class="position-icon">
                {{ position.icon }}
              </div>
              <span>{{ position.label }}</span>
            </button>
          </div>
        </fieldset>
      </div>

      <!-- Couleurs -->
      <div class="customization-section">
        <fieldset>
          <legend class="section-label">
            Couleurs
          </legend>
          <div class="color-grid">
            <button
              v-for="color in availableColors"
              :key="color.value"
              :class="[
                'color-btn',
                {
                  'color-btn--selected': customization.colors?.includes(
                    color.value
                  ),
                },
              ]"
              :style="{ backgroundColor: color.hex }"
              :title="color.name"
              @click="toggleColor(color.value)"
            >
              <svg
                v-if="customization.colors?.includes(color.value)"
                class="color-check"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"
                  fill="white"
                />
              </svg>
            </button>
          </div>
        </fieldset>
      </div>
    </div>

    <!-- Prévisualisation -->
    <div class="preview-panel">
      <h3 class="panel-title">
        Aperçu
      </h3>

      <!-- Canvas de prévisualisation -->
      <div class="preview-container">
        <canvas
          ref="previewCanvas"
          :width="canvasWidth"
          :height="canvasHeight"
          class="preview-canvas"
        />

        <!-- Overlay pour afficher les détails -->
        <div class="preview-overlay">
          <div class="overlay-content">
            <h4 class="product-name">
              {{ product.name }}
            </h4>
            <p class="product-category">
              {{ product.category }}
            </p>

            <div
              v-if="customization.text || customization.logoUrl"
              class="customization-summary"
            >
              <div v-if="customization.logoUrl" class="summary-item">
                <span class="summary-label">Logo:</span>
                <span class="summary-value">Ajouté</span>
              </div>
              <div v-if="customization.text" class="summary-item">
                <span class="summary-label">Texte:</span>
                <span class="summary-value">"{{ customization.text }}"</span>
              </div>
              <div v-if="customization.position" class="summary-item">
                <span class="summary-label">Position:</span>
                <span class="summary-value">{{
                  getPositionLabel(customization.position)
                }}</span>
              </div>
              <div v-if="customization.colors?.length" class="summary-item">
                <span class="summary-label">Couleurs:</span>
                <div class="summary-colors">
                  <div
                    v-for="color in customization.colors"
                    :key="color"
                    class="summary-color"
                    :style="{ backgroundColor: getColorHex(color) }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calcul de prix en temps réel -->
      <div class="price-section">
        <h4 class="section-label">
          Estimation du prix
        </h4>

        <!-- Sélecteur de quantité -->
        <div class="quantity-selector">
          <label for="quantity" class="quantity-label"> Quantité : </label>
          <input
            id="quantity"
            v-model.number="quantity"
            type="number"
            :min="props.product.minQuantity || 1"
            :max="props.product.maxQuantity || 10000"
            class="quantity-input"
          >
          <span class="quantity-hint">
            (Min: {{ props.product.minQuantity || 1 }})
          </span>
        </div>

        <!-- Breakdown des coûts -->
        <div class="price-breakdown">
          <div class="price-line">
            <span class="price-label">Prix unitaire de base :</span>
            <span class="price-value">{{
              formatCurrency(props.product.basePrice)
            }}</span>
          </div>

          <div
            v-if="priceCalculation.customizationsCost > 0"
            class="price-line"
          >
            <span class="price-label">Personnalisations :</span>
            <span class="price-value">{{
              formatCurrency(priceCalculation.customizationsCost)
            }}</span>
          </div>

          <div
            v-if="priceCalculation.appliedRules.length > 0"
            class="price-line"
          >
            <span class="price-label">Remises/Majorations :</span>
            <div class="rules-list">
              <div
                v-for="rule in priceCalculation.appliedRules"
                :key="rule.ruleId"
                class="rule-item"
              >
                <span class="rule-name">{{ rule.ruleName }}</span>
                <span
                  :class="[
                    'rule-value',
                    rule.modifier < 0 ? 'text-green-600' : 'text-orange-600',
                  ]"
                >
                  {{ rule.modifier < 0 ? "" : "+"
                  }}{{ formatCurrency(rule.modifier) }}
                </span>
              </div>
            </div>
          </div>

          <div class="price-line price-line--total">
            <span class="price-label">Prix unitaire final :</span>
            <span class="price-value price-value--highlight">{{
              formatCurrency(priceCalculation.unitPrice)
            }}</span>
          </div>

          <div class="price-line price-line--total">
            <span class="price-label">Total ({{ quantity }} unités) :</span>
            <span class="price-value price-value--total">{{
              formatCurrency(priceCalculation.totalPrice)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="preview-actions">
        <Button variant="outline" @click="resetCustomization">
          Réinitialiser
        </Button>
        <Button variant="secondary" @click="exportPreview">
          Télécharger Aperçu
        </Button>
        <Button variant="primary" @click="saveCustomization">
          Valider la personnalisation
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted, computed } from "vue";
import { debounce } from "lodash-es";
import { Button } from "@ns2po/ui";
import CloudinaryUpload from "./CloudinaryUpload.vue";
// Auto-imported via Nuxt 3: useQuoteCalculator
import type {
  Product,
  ProductCustomization,
  LogoCustomization,
  CustomizationPosition,
  CloudinaryUploadResult,
} from "@ns2po/types";

// Interface mutable pour la personnalisation du composant
interface MutableProductCustomization {
  logoUrl?: string; // Support rétrocompatible
  logos?: LogoCustomization[];
  text?: string;
  colors?: string[];
  position?: CustomizationPosition;
}

interface Props {
  product: Product;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "customization:change": [customization: ProductCustomization];
  "customization:save": [customization: ProductCustomization];
}>();

// État de personnalisation
const customization = ref<MutableProductCustomization>({
  logoUrl: undefined,
  logos: [],
  text: "",
  colors: [],
  position: "FRONT",
});

// État pour l'interface multi-logos
const selectedLogoIndex = ref<number | null>(null);
const draggedLogo = ref<string | null>(null);

// Configuration du canvas adaptatif pour mobile
const isTouch = ref(false);
const devicePixelRatio = ref(1);

// Détection mobile optimisée
const isMobile = computed(() => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || isTouch.value;
});

// Dimensions du canvas adaptatives pour les performances
const canvasWidth = computed(() => (isMobile.value ? 300 : 400));
const canvasHeight = computed(() => (isMobile.value ? 375 : 500));
const previewCanvas = ref<HTMLCanvasElement>();

// État pour le calcul de prix
const quantity = ref(10); // Quantité minimale par défaut
const { calculateProductPrice, formatCurrency } = useQuoteCalculator();

// Calcul du prix en temps réel
const priceCalculation = computed(() => {
  // Calculer le coût des personnalisations
  const customizations = [];

  // Coût des logos (exemple : 500 FCFA par logo)
  if (customization.value.logos?.length) {
    customizations.push({
      priceModifier: customization.value.logos.length * 500,
    });
  }

  // Coût du texte (exemple : 300 FCFA)
  if (customization.value.text && customization.value.text.trim()) {
    customizations.push({ priceModifier: 300 });
  }

  // Coût des couleurs personnalisées (exemple : 200 FCFA par couleur)
  if (customization.value.colors?.length) {
    customizations.push({
      priceModifier: customization.value.colors.length * 200,
    });
  }

  // Log pour l'observabilité
  if (typeof window !== "undefined") {
    console.group("🎨 [NS2PO Debug] ProductPreview - Price Calculation");
    console.info("Product:", props.product.name);
    console.info("Base Price:", props.product.basePrice);
    console.info("Quantity:", quantity.value);
    console.info("Customizations:", {
      logos: customization.value.logos?.length || 0,
      text: customization.value.text ? "Yes" : "No",
      colors: customization.value.colors?.length || 0,
    });
    console.info("Customization Costs:", customizations);
    console.groupEnd();
  }

  return calculateProductPrice(
    props.product.basePrice,
    quantity.value,
    customizations
  );
});

// Positions disponibles
const availablePositions = [
  { value: "FRONT", label: "Devant", icon: "👕" },
  { value: "BACK", label: "Dos", icon: "🔄" },
  { value: "SLEEVE", label: "Manche", icon: "👔" },
  { value: "CHEST", label: "Poitrine", icon: "❤️" },
] as const;

// Couleurs disponibles
const availableColors = [
  { value: "red", name: "Rouge", hex: "#EF4444" },
  { value: "blue", name: "Bleu", hex: "#3B82F6" },
  { value: "green", name: "Vert", hex: "#10B981" },
  { value: "yellow", name: "Jaune", hex: "#F59E0B" },
  { value: "purple", name: "Violet", hex: "#8B5CF6" },
  { value: "orange", name: "Orange", hex: "#F97316" },
  { value: "pink", name: "Rose", hex: "#EC4899" },
  { value: "black", name: "Noir", hex: "#1F2937" },
  { value: "white", name: "Blanc", hex: "#FFFFFF" },
  { value: "gray", name: "Gris", hex: "#6B7280" },
];

// Méthodes
const handleLogoUpload = (result: CloudinaryUploadResult) => {
  customization.value.logoUrl = result.secure_url;
  debouncedUpdatePreview();
  emitChange();
};

const uploadError = ref<string | null>(null);

const handleUploadError = (error: string) => {
  console.error("Erreur upload logo:", error);
  uploadError.value =
    "Erreur lors du téléchargement du logo. Veuillez réessayer.";

  // Clear error after 5 seconds
  setTimeout(() => {
    uploadError.value = null;
  }, 5000);
};

// Méthodes pour gérer plusieurs logos
const addLogo = (result: CloudinaryUploadResult) => {
  if (!customization.value.logos) {
    customization.value.logos = [];
  }

  // Tailles adaptatives selon l'écran
  const logoSize = isMobile.value ? 60 : 80;
  const newLogo: LogoCustomization = {
    id: `logo-${Date.now()}`,
    url: result.secure_url,
    x: canvasWidth.value / 2 - logoSize / 2, // Position centrale par défaut
    y: canvasHeight.value * 0.3,
    width: logoSize,
    height: logoSize,
    rotation: 0,
    opacity: 1,
  };

  customization.value.logos = [...customization.value.logos, newLogo];
  selectedLogoIndex.value = customization.value.logos.length - 1;
  debouncedUpdatePreview();
  emitChange();
};

const updateLogo = (index: number, updates: Partial<LogoCustomization>) => {
  if (!customization.value.logos || !customization.value.logos[index]) return;

  customization.value.logos = customization.value.logos.map((logo, i) =>
    i === index ? { ...logo, ...updates } : logo
  );

  debouncedUpdatePreview();
  emitChange();
};

const removeLogo = (index: number) => {
  if (!customization.value.logos || !customization.value.logos[index]) return;

  customization.value.logos = customization.value.logos.filter(
    (_, i) => i !== index
  );

  if (selectedLogoIndex.value === index) {
    selectedLogoIndex.value = null;
  } else if (
    selectedLogoIndex.value !== null &&
    selectedLogoIndex.value > index
  ) {
    selectedLogoIndex.value--;
  }

  debouncedUpdatePreview();
  emitChange();
};

const selectLogo = (index: number) => {
  selectedLogoIndex.value = index;
};

const toggleColor = (color: string) => {
  if (!customization.value.colors) {
    customization.value.colors = [];
  }

  const currentColors = [...customization.value.colors];
  const index = currentColors.indexOf(color);

  if (index > -1) {
    currentColors.splice(index, 1);
  } else {
    currentColors.push(color);
  }

  customization.value.colors = currentColors;
  debouncedUpdatePreview();
  emitChange();
};

const getPositionLabel = (position: CustomizationPosition): string => {
  return (
    availablePositions.find((p) => p.value === position)?.label || position
  );
};

const getColorHex = (color: string): string => {
  return availableColors.find((c) => c.value === color)?.hex || "#000000";
};

// Cache des images pour éviter les rechargements
const imageCache = new Map<string, HTMLImageElement>();

const updatePreview = async () => {
  await nextTick();

  if (!previewCanvas.value) return;

  const canvas = previewCanvas.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Performance: Set canvas dimensions dynamically
  const currentWidth = canvasWidth.value;
  const currentHeight = canvasHeight.value;

  // Optimisation mobile: réduire la qualité sur mobile pour les performances
  if (isMobile.value) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  // Effacer le canvas avec les nouvelles dimensions
  ctx.clearRect(0, 0, currentWidth, currentHeight);

  try {
    // Dessiner l'image de base du produit
    if (props.product.image) {
      let productImg = imageCache.get(props.product.image);

      if (!productImg) {
        productImg = new Image();
        productImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          productImg!.onload = () => {
            imageCache.set(props.product.image!, productImg!);
            resolve();
          };
          productImg!.onerror = reject;
          productImg!.src = props.product.image!;
        });
      }

      // Dessiner l'image du produit avec les dimensions actuelles
      ctx.drawImage(productImg, 0, 0, currentWidth, currentHeight);
    } else {
      // Image par défaut (rectangle avec texte)
      ctx.fillStyle = "#F3F4F6";
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      ctx.fillStyle = "#6B7280";
      ctx.font = isMobile.value ? "14px sans-serif" : "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Image du produit", currentWidth / 2, currentHeight / 2);
    }

    // Appliquer les couleurs (effet overlay)
    if (customization.value.colors?.length) {
      const primaryColor = customization.value.colors[0];
      const colorHex = primaryColor ? getColorHex(primaryColor) : "#000000";

      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    // Dessiner les logos s'ils sont présents
    if (customization.value.logos?.length) {
      for (const logo of customization.value.logos) {
        let logoImg = imageCache.get(logo.url);

        if (!logoImg) {
          logoImg = new Image();
          logoImg.crossOrigin = "anonymous";

          await new Promise<void>((resolve, reject) => {
            logoImg!.onload = () => {
              imageCache.set(logo.url, logoImg!);
              resolve();
            };
            logoImg!.onerror = reject;
            logoImg!.src = logo.url;
          });
        }

        // Appliquer les transformations (rotation, opacité)
        ctx.save();

        if (logo.opacity !== undefined) {
          ctx.globalAlpha = logo.opacity;
        }

        if (logo.rotation) {
          const centerX = logo.x + logo.width / 2;
          const centerY = logo.y + logo.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((logo.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        // Dessiner le logo avec position et taille précises
        ctx.drawImage(logoImg, logo.x, logo.y, logo.width, logo.height);

        ctx.restore();
      }
    }

    // Support rétrocompatible pour logoUrl unique
    else if (customization.value.logoUrl) {
      let logoImg = imageCache.get(customization.value.logoUrl);

      if (!logoImg) {
        logoImg = new Image();
        logoImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          logoImg!.onload = () => {
            imageCache.set(customization.value.logoUrl!, logoImg!);
            resolve();
          };
          logoImg!.onerror = reject;
          logoImg!.src = customization.value.logoUrl!;
        });
      }

      // Position du logo selon la zone sélectionnée (adaptatif mobile)
      const logoSize = isMobile.value ? 60 : 80;
      const positions = {
        FRONT: { x: currentWidth / 2 - logoSize / 2, y: currentHeight * 0.3 },
        BACK: { x: currentWidth / 2 - logoSize / 2, y: currentHeight * 0.2 },
        SLEEVE: { x: currentWidth * 0.15, y: currentHeight * 0.4 },
        CHEST: { x: currentWidth / 2 - logoSize / 2, y: currentHeight * 0.25 },
      };

      const pos = positions[customization.value.position || "FRONT"];
      ctx.drawImage(logoImg, pos.x, pos.y, logoSize, logoSize);
    }

    // Dessiner le texte si présent
    if (customization.value.text) {
      const textPositions = {
        FRONT: { x: currentWidth / 2, y: currentHeight * 0.6 },
        BACK: { x: currentWidth / 2, y: currentHeight * 0.5 },
        SLEEVE: { x: currentWidth * 0.15, y: currentHeight * 0.6 },
        CHEST: { x: currentWidth / 2, y: currentHeight * 0.45 },
      };

      const pos = textPositions[customization.value.position || "FRONT"];

      // Adapter la taille de police selon l'écran
      ctx.font = isMobile.value
        ? "bold 14px sans-serif"
        : "bold 18px sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";

      ctx.strokeText(customization.value.text, pos.x, pos.y);
      ctx.fillText(customization.value.text, pos.x, pos.y);
    }
  } catch (error) {
    console.error("Erreur lors du rendu de la prévisualisation:", error);
    // Afficher un message d'erreur plus convivial
    uploadError.value =
      "Erreur lors de la prévisualisation. Veuillez réessayer.";
    setTimeout(() => {
      uploadError.value = null;
    }, 3000);
  }
};

// Version debounced pour optimiser les performances
// (sera redéfinie dans l'initialisation pour s'adapter au type d'appareil)

const resetCustomization = () => {
  customization.value = {
    logoUrl: undefined,
    logos: [],
    text: "",
    colors: [],
    position: "FRONT",
  };
  selectedLogoIndex.value = null;
  debouncedUpdatePreview();
  emitChange();
};

const saveCustomization = () => {
  emit("customization:save", { ...customization.value });
};

const exportPreview = async () => {
  if (!previewCanvas.value) return;

  try {
    // Créer un canvas haute résolution pour l'export
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    // Augmenter la résolution pour l'export (2x)
    const exportScale = 2;
    exportCanvas.width = canvasWidth.value * exportScale;
    exportCanvas.height = canvasHeight.value * exportScale;
    exportCtx.scale(exportScale, exportScale);

    // Redessiner à haute résolution
    await renderCanvasContent(exportCtx, canvasWidth, canvasHeight);

    // Export en PNG haute qualité
    const link = document.createElement("a");
    link.download = `preview-${props.product.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          // Notification de succès
          console.log("Aperçu exporté avec succès:", link.download);
        }
      },
      "image/png",
      1.0
    );
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
  }
};

const renderCanvasContent = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // Fond du produit
  if (props.product.image && imageCache.has(props.product.image)) {
    const productImg = imageCache.get(props.product.image);
    if (productImg) {
      ctx.drawImage(productImg, 0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);
  }

  // Overlay de couleur si sélectionnée
  if (customization.value.colors && customization.value.colors.length > 0) {
    const color = availableColors.find(
      (c) => c.value === customization.value.colors![0]
    );
    if (color && color.value !== "white") {
      ctx.fillStyle = color.hex;
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // Logos
  if (customization.value.logos) {
    for (const logo of customization.value.logos) {
      if (imageCache.has(logo.url)) {
        const logoImg = imageCache.get(logo.url);
        if (logoImg) {
          ctx.save();

          if (logo.opacity !== undefined) {
            ctx.globalAlpha = logo.opacity;
          }

          if (logo.rotation) {
            const centerX = logo.x + logo.width / 2;
            const centerY = logo.y + logo.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((logo.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }

          ctx.drawImage(logoImg, logo.x, logo.y, logo.width, logo.height);
          ctx.restore();
        }
      }
    }
  }

  // Texte
  if (customization.value.text) {
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(customization.value.text, width / 2, height - 50);
  }
};

const emitChange = () => {
  emit("customization:change", { ...customization.value });
};

// Watchers
watch(
  () => customization.value.text,
  () => {
    debouncedUpdatePreview();
    emitChange();
  }
);

watch(
  () => customization.value.position,
  () => {
    debouncedUpdatePreview();
    emitChange();
  }
);

// Détection des capacités du device
const initDeviceDetection = () => {
  if (typeof window !== "undefined") {
    // Détection tactile
    isTouch.value = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Device pixel ratio pour la qualité d'affichage
    devicePixelRatio.value = window.devicePixelRatio || 1;

    // Écouter les changements d'orientation/taille d'écran
    const handleResize = debounce(() => {
      updatePreview();
    }, 200);

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Nettoyage
    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    });
  }
};

// Déclaration de la fonction debounced (sera initialisée dans onMounted)
let debouncedUpdatePreview: ReturnType<typeof debounce>;

// Initialisation
onMounted(() => {
  initDeviceDetection();

  // Initialiser la fonction debounced selon le type d'appareil
  debouncedUpdatePreview = isMobile.value
    ? debounce(() => {
        requestAnimationFrame(updatePreview);
      }, 200) // Plus long délai sur mobile
    : debounce(updatePreview, 150);

  updatePreview();
});

// Note: Icon components removed as they were unused
</script>

<style scoped>
.product-preview {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto;
}

.customization-panel,
.preview-panel {
  @apply bg-white rounded-lg shadow-lg p-6;
}

.panel-title {
  @apply text-xl font-bold text-gray-900 mb-6;
}

.customization-section {
  @apply mb-6;
}

.section-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.text-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.position-grid {
  @apply grid grid-cols-2 gap-3;
}

.position-btn {
  @apply flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors;
}

.position-btn--active {
  @apply border-blue-500 bg-blue-50;
}

.position-icon {
  @apply mb-2;
}

.color-grid {
  @apply grid grid-cols-5 gap-2;
}

.color-btn {
  @apply w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center transition-all hover:scale-110;
}

.color-btn--selected {
  @apply border-gray-900 ring-2 ring-offset-2 ring-blue-500;
}

.color-check {
  @apply w-4 h-4;
}

.preview-container {
  @apply relative bg-gray-100 rounded-lg overflow-hidden mb-6;
}

.preview-canvas {
  @apply w-full max-w-md mx-auto block;
}

.preview-overlay {
  @apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4;
}

.overlay-content {
  @apply text-white;
}

.product-name {
  @apply text-lg font-bold mb-1;
}

.product-category {
  @apply text-sm opacity-90 mb-3;
}

.customization-summary {
  @apply space-y-1;
}

.summary-item {
  @apply flex items-center space-x-2 text-sm;
}

.summary-label {
  @apply font-medium;
}

.summary-value {
  @apply opacity-90;
}

.summary-colors {
  @apply flex space-x-1;
}

.summary-color {
  @apply w-4 h-4 rounded-full border border-white/30;
}

.preview-actions {
  @apply flex space-x-3;
}

.error-message {
  @apply mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start space-x-3;
}

.error-icon {
  @apply text-red-500 flex-shrink-0 mt-0.5;
}

.error-content {
  @apply flex-1;
}

.error-title {
  @apply block font-medium mb-1;
}

.error-text {
  @apply block text-red-600;
}

.error-dismiss {
  @apply text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5 transition-colors;
}

/* Styles pour la gestion multi-logos */
.section-header {
  @apply flex items-center justify-between mb-4;
}

.logos-list {
  @apply space-y-4 max-h-80 overflow-y-auto;
}

.logo-item {
  @apply border-2 border-gray-200 rounded-lg p-3 cursor-pointer transition-all hover:border-gray-300;
}

.logo-item--selected {
  @apply border-blue-500 bg-blue-50;
}

.logo-preview {
  @apply w-16 h-16 object-contain rounded border bg-white mb-3;
}

.logo-controls {
  @apply space-y-2;
}

.control-label {
  @apply text-xs font-medium text-gray-600 block;
}

.control-slider {
  @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

.control-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
}

.control-slider::-moz-range-thumb {
  @apply w-4 h-4 bg-blue-500 rounded-full cursor-pointer border-0;
}

.remove-logo-btn {
  @apply w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors ml-auto;
}

/* Styles pour la section de prix */
.price-section {
  @apply mt-6 p-4 bg-gray-50 rounded-lg border;
}

.quantity-selector {
  @apply mb-4 flex items-center space-x-2;
}

.quantity-input {
  @apply w-20 px-2 py-1 border border-gray-300 rounded text-center;
}

.price-breakdown {
  @apply space-y-2;
}

.price-line {
  @apply flex justify-between items-center text-sm;
}

.price-line--total {
  @apply border-t pt-2 font-semibold;
}

.price-value--total {
  @apply text-lg font-bold text-blue-600;
}
</style>
