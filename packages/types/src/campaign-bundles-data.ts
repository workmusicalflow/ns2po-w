/**
 * Données des packs de campagne pré-configurés NS2PO
 * Sprint Correction Itérative - 3 packs simplifiés pour optimiser l'expérience utilisateur
 * Basées sur l'expérience terrain des élections ivoiriennes
 */

import type { CampaignBundle, BundleProduct } from "./bundle";

// =====================================
// PRODUITS DE BASE (basé sur QuoteItemCatalog existant)
// =====================================

const createBundleProduct = (
  id: string,
  name: string,
  basePrice: number,
  quantity: number,
): BundleProduct => ({
  id,
  name,
  basePrice,
  quantity,
  subtotal: basePrice * quantity,
});

// =====================================
// PACK ARGENT - 5K PERSONNES CIBLÉES
// =====================================

const packArgent: CampaignBundle = {
  id: "pack-argent-001",
  name: "Pack Argent",
  description:
    "Idéal pour toucher 5 000 personnes. L'essentiel pour lancer votre campagne locale avec impact et visibilité de proximité garantie.",
  targetAudience: "local",
  budgetRange: "starter",
  products: [
    createBundleProduct(
      "casquette-argent",
      "Casquettes personnalisées",
      2500,
      150,
    ),
    createBundleProduct("t-shirt-argent", "T-shirts de campagne", 3500, 100),
    createBundleProduct("autocollant-argent", "Autocollants", 150, 1000),
    createBundleProduct("flyers-argent", "Flyers A5", 200, 2000),
    createBundleProduct("sac-argent", "Sacs cabas personnalisés", 1500, 200),
  ],
  estimatedTotal: 1140000, // Remise de 10% appliquée
  originalTotal: 1267500,
  savings: 127500,
  popularity: 95,
  isActive: true,
  isFeatured: true,
  tags: ["5k-personnes", "campagne-locale", "budget-optimisé"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-09-14T23:25:00Z",
};

// =====================================
// PACK OR - 10K-15K PERSONNES CIBLÉES
// =====================================

const packOr: CampaignBundle = {
  id: "pack-or-001",
  name: "Pack Or",
  description:
    "Parfait pour toucher 10 000 à 15 000 personnes. Équipement professionnel et supports premium pour une campagne d'envergure départementale.",
  targetAudience: "regional",
  budgetRange: "medium",
  products: [
    createBundleProduct("casquette-or", "Casquettes brodées premium", 3500, 800),
    createBundleProduct("t-shirt-or", "T-shirts qualité export", 4500, 500),
    createBundleProduct("polo-or", "Polos dirigeants", 7000, 300),
    createBundleProduct("veste-or", "Vestes militants", 8500, 200),
    createBundleProduct("parapluie-or", "Parapluies publicitaires", 4500, 400),
    createBundleProduct("autocollant-or", "Autocollants véhicules", 200, 3000),
    createBundleProduct("banderole-or", "Banderoles grand format", 25000, 30),
    createBundleProduct("affiche-or", "Affiches A2", 500, 2000),
    createBundleProduct("sac-or", "Sacs à dos personnalisés", 8000, 500),
  ],
  estimatedTotal: 5700000, // Remise de 15% appliquée
  originalTotal: 6705000,
  savings: 1005000,
  popularity: 92,
  isActive: true,
  isFeatured: true,
  tags: ["10k-15k-personnes", "départementale", "couverture-étendue"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-09-14T23:25:00Z",
};

// =====================================
// PACK PLATINIUM - 20K-30K PERSONNES CIBLÉES
// =====================================

const packPlatinium: CampaignBundle = {
  id: "pack-platinium-001",
  name: "Pack Platinium",
  description:
    "L'arsenal complet pour toucher 20 000 à 30 000 personnes. Équipement de luxe et logistique complète pour une campagne nationale victorieuse.",
  targetAudience: "national",
  budgetRange: "premium",
  products: [
    createBundleProduct("casquette-platinium", "Casquettes premium édition limitée", 5000, 2000),
    createBundleProduct("t-shirt-platinium", "T-shirts collector premium", 6000, 1500),
    createBundleProduct("polo-platinium", "Polos dirigeants premium", 9000, 800),
    createBundleProduct("veste-platinium", "Vestes de représentation", 15000, 500),
    createBundleProduct("sac-platinium", "Attaché-cases executive", 25000, 300),
    createBundleProduct("parapluie-platinium", "Parapluies premium", 6500, 1000),
    createBundleProduct("banderole-platinium", "Banderoles nationales mesh", 45000, 80),
    createBundleProduct("drapeau-platinium", "Drapeaux officiels", 3500, 500),
    createBundleProduct("tente-platinium", "Tentes pliables événementielles", 45000, 40),
    createBundleProduct("panneau-platinium", "Panneaux dibond grand format", 12000, 200),
    createBundleProduct("vehicule-platinium", "Covering véhicules premium", 200000, 30),
  ],
  estimatedTotal: 18500000, // Remise de 25% appliquée
  originalTotal: 24666667,
  savings: 6166667,
  popularity: 85,
  isActive: true,
  isFeatured: true,
  tags: ["20k-30k-personnes", "national", "prestige", "premium"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-09-14T23:25:00Z",
};

// =====================================
// EXPORT DES DONNÉES - 3 PACKS SIMPLIFIÉS
// =====================================

export const campaignBundles: CampaignBundle[] = [
  // Pack Argent - 5K personnes
  packArgent,

  // Pack Or - 10K-15K personnes
  packOr,

  // Pack Platinium - 20K-30K personnes
  packPlatinium,
];

// Utilitaires pour filtrer les bundles
export const getBundlesByAudience = (audience: string) =>
  campaignBundles.filter((bundle) => bundle.targetAudience === audience);

export const getBundlesByBudget = (budget: string) =>
  campaignBundles.filter((bundle) => bundle.budgetRange === budget);

export const getFeaturedBundles = () =>
  campaignBundles.filter((bundle) => bundle.isFeatured);

export const getActiveBundles = () =>
  campaignBundles.filter((bundle) => bundle.isActive);

export const getBundleById = (id: string) =>
  campaignBundles.find((bundle) => bundle.id === id);

// Statistiques des bundles
export const getBundleStats = () => ({
  total: campaignBundles.length,
  byAudience: {
    local: getBundlesByAudience("local").length,
    regional: getBundlesByAudience("regional").length,
    national: getBundlesByAudience("national").length,
    universal: getBundlesByAudience("universal").length,
  },
  byBudget: {
    starter: getBundlesByBudget("starter").length,
    medium: getBundlesByBudget("medium").length,
    premium: getBundlesByBudget("premium").length,
    enterprise: getBundlesByBudget("enterprise").length,
  },
  featured: getFeaturedBundles().length,
  active: getActiveBundles().length,
});
