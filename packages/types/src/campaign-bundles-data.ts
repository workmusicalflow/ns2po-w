/**
 * Données des packs de campagne pré-configurés NS2PO
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
// PACKS CAMPAGNE LOCALE (Municipales/Communales)
// =====================================

const localStarterPack: CampaignBundle = {
  id: "local-starter-001",
  name: "Pack Candidat Local",
  description:
    "L'essentiel pour lancer votre campagne municipale. Visibilité de proximité garantie avec des produits de qualité pour marquer votre territoire.",
  targetAudience: "local",
  budgetRange: "starter",
  products: [
    createBundleProduct(
      "casquette-001",
      "Casquettes personnalisées",
      2500,
      100,
    ),
    createBundleProduct("t-shirt-001", "T-shirts de campagne", 3500, 50),
    createBundleProduct("autocollant-001", "Autocollants", 150, 500),
    createBundleProduct("flyers-001", "Flyers A5", 200, 1000),
  ],
  estimatedTotal: 495000, // Remise de 5% appliquée
  originalTotal: 520000,
  savings: 25000,
  popularity: 95,
  isActive: true,
  isFeatured: true,
  tags: ["débutant", "budget-maîtrisé", "visibilité-locale"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

const localMediumPack: CampaignBundle = {
  id: "local-medium-001",
  name: "Pack Mobilisation Quartier",
  description:
    "Pour une campagne de proximité renforcée. Équipez vos militants et créez l'effet de groupe dans votre commune.",
  targetAudience: "local",
  budgetRange: "medium",
  products: [
    createBundleProduct("casquette-002", "Casquettes premium", 3000, 200),
    createBundleProduct(
      "t-shirt-002",
      "T-shirts qualité supérieure",
      4500,
      100,
    ),
    createBundleProduct("polo-001", "Polos militants", 6000, 50),
    createBundleProduct("sac-001", "Sacs cabas personnalisés", 1500, 200),
    createBundleProduct("banderole-001", "Banderoles PVC", 15000, 10),
    createBundleProduct("stylo-001", "Stylos publicitaires", 300, 500),
  ],
  estimatedTotal: 1085000, // Remise de 10% appliquée
  originalTotal: 1205000,
  savings: 120000,
  popularity: 88,
  isActive: true,
  isFeatured: false,
  tags: ["mobilisation", "équipe-campagne", "visibilité-renforcée"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

// =====================================
// PACKS CAMPAGNE RÉGIONALE (Départementales/Régionales)
// =====================================

const regionalMediumPack: CampaignBundle = {
  id: "regional-medium-001",
  name: "Pack Candidat Départemental",
  description:
    "Couvrez votre département avec impact. Mix optimal entre visibilité véhicule et équipement militant pour une campagne d'envergure.",
  targetAudience: "regional",
  budgetRange: "premium",
  products: [
    createBundleProduct("casquette-003", "Casquettes brodées", 3500, 500),
    createBundleProduct("t-shirt-003", "T-shirts campagne", 4000, 300),
    createBundleProduct("veste-001", "Vestes militants", 8500, 100),
    createBundleProduct("parapluie-001", "Parapluies publicitaires", 4500, 200),
    createBundleProduct("autocollant-002", "Autocollants véhicules", 200, 2000),
    createBundleProduct("banderole-002", "Banderoles grand format", 25000, 20),
    createBundleProduct("affiche-001", "Affiches A2", 500, 1000),
  ],
  estimatedTotal: 2850000, // Remise de 15% appliquée
  originalTotal: 3350000,
  savings: 500000,
  popularity: 92,
  isActive: true,
  isFeatured: true,
  tags: ["départementale", "couverture-étendue", "véhicules"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

const regionalPremiumPack: CampaignBundle = {
  id: "regional-premium-001",
  name: "Pack Conquête Régionale",
  description:
    "L'arsenal complet pour dominer votre région. Equipement professionnel, supports premium et logistique complète pour une campagne victorieuse.",
  targetAudience: "regional",
  budgetRange: "enterprise",
  products: [
    createBundleProduct(
      "casquette-004",
      "Casquettes premium brodées",
      4000,
      1000,
    ),
    createBundleProduct("t-shirt-004", "T-shirts qualité export", 5000, 500),
    createBundleProduct("polo-002", "Polos dirigeants", 7500, 200),
    createBundleProduct("veste-002", "Vestes imperméables", 12000, 150),
    createBundleProduct("sac-002", "Sacs à dos personnalisés", 8000, 300),
    createBundleProduct("parasol-001", "Parasols publicitaires", 15000, 50),
    createBundleProduct("tente-001", "Tentes pliables", 45000, 20),
    createBundleProduct("banderole-003", "Banderoles mesh", 35000, 30),
    createBundleProduct("panneau-001", "Panneaux dibond", 8000, 100),
  ],
  estimatedTotal: 6650000, // Remise de 20% appliquée
  originalTotal: 8312500,
  savings: 1662500,
  popularity: 78,
  isActive: true,
  tags: ["premium", "professionnel", "équipement-complet"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

// =====================================
// PACKS CAMPAGNE NATIONALE (Présidentielles/Législatives)
// =====================================

const nationalPremiumPack: CampaignBundle = {
  id: "national-premium-001",
  name: "Pack Candidat National",
  description:
    "Rayonnement national garanti. Équipement haut de gamme pour représenter votre mouvement à l'échelle du pays avec distinction.",
  targetAudience: "national",
  budgetRange: "enterprise",
  products: [
    createBundleProduct(
      "casquette-005",
      "Casquettes brodées premium",
      4500,
      2000,
    ),
    createBundleProduct("t-shirt-005", "T-shirts premium", 5500, 1000),
    createBundleProduct("polo-003", "Polos dirigeants premium", 8500, 500),
    createBundleProduct("veste-003", "Vestes de représentation", 15000, 300),
    createBundleProduct("cravate-001", "Cravates personnalisées", 6000, 200),
    createBundleProduct("sac-003", "Attaché-cases", 25000, 100),
    createBundleProduct("parapluie-002", "Parapluies premium", 6500, 500),
    createBundleProduct("banderole-004", "Banderoles nationales", 50000, 100),
    createBundleProduct("drapeau-001", "Drapeaux officiels", 3000, 200),
  ],
  estimatedTotal: 12750000, // Remise de 25% appliquée
  originalTotal: 17000000,
  savings: 4250000,
  popularity: 85,
  isActive: true,
  isFeatured: true,
  tags: ["national", "prestige", "représentation"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

const nationalEnterprisePack: CampaignBundle = {
  id: "national-enterprise-001",
  name: "Pack Présidentiel Elite",
  description:
    "L'excellence absolue pour une campagne présidentielle. Équipement de luxe, supports média et logistique VIP pour marquer l'histoire.",
  targetAudience: "national",
  budgetRange: "enterprise",
  products: [
    createBundleProduct("costume-001", "Costumes sur-mesure", 150000, 50),
    createBundleProduct(
      "casquette-006",
      "Casquettes premium édition limitée",
      6000,
      3000,
    ),
    createBundleProduct("t-shirt-006", "T-shirts collector", 7500, 2000),
    createBundleProduct("polo-004", "Polos premium équipe", 12000, 1000),
    createBundleProduct("veste-004", "Vestes protocole", 25000, 500),
    createBundleProduct("sac-004", "Mallettes executive", 45000, 200),
    createBundleProduct("montre-001", "Montres personnalisées", 35000, 100),
    createBundleProduct("vehicule-001", "Covering véhicules", 200000, 20),
    createBundleProduct("mobilier-001", "Mobilier événementiel", 75000, 50),
    createBundleProduct("ecran-001", "Écrans LED mobiles", 500000, 10),
  ],
  estimatedTotal: 32500000, // Remise de 30% appliquée
  originalTotal: 46428571,
  savings: 13928571,
  popularity: 70,
  isActive: true,
  tags: ["présidentiel", "luxe", "média", "VIP"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

// =====================================
// PACKS UNIVERSELS (Tous niveaux)
// =====================================

const universalStarterPack: CampaignBundle = {
  id: "universal-starter-001",
  name: "Pack Découverte Politique",
  description:
    "Votre première campagne ? Commencez avec les essentiels. Kit parfait pour tester l'engagement de votre base électorale.",
  targetAudience: "universal",
  budgetRange: "starter",
  products: [
    createBundleProduct("casquette-007", "Casquettes basiques", 2000, 50),
    createBundleProduct("t-shirt-007", "T-shirts simple", 3000, 30),
    createBundleProduct("autocollant-003", "Autocollants de base", 100, 500),
    createBundleProduct("badge-001", "Badges épingle", 200, 200),
    createBundleProduct("flyers-002", "Flyers simple", 150, 1000),
  ],
  estimatedTotal: 285000,
  originalTotal: 295000,
  savings: 10000,
  popularity: 82,
  isActive: true,
  tags: ["débutant", "test", "économique"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

const universalMediumPack: CampaignBundle = {
  id: "universal-medium-001",
  name: "Pack Campagne Équilibrée",
  description:
    "L'équilibre parfait pour toute campagne. Adaptable à tous niveaux avec un excellent rapport qualité-prix.",
  targetAudience: "universal",
  budgetRange: "medium",
  products: [
    createBundleProduct("casquette-008", "Casquettes standard", 2800, 150),
    createBundleProduct("t-shirt-008", "T-shirts campagne", 3800, 100),
    createBundleProduct("polo-005", "Polos équipe", 5500, 50),
    createBundleProduct("sac-005", "Sacs publicitaires", 2000, 150),
    createBundleProduct("stylo-002", "Stylos gravés", 500, 300),
    createBundleProduct("calendrier-001", "Calendriers photo", 800, 200),
    createBundleProduct("banderole-005", "Banderoles standard", 12000, 15),
  ],
  estimatedTotal: 1140000, // Remise de 12% appliquée
  originalTotal: 1295000,
  savings: 155000,
  popularity: 90,
  isActive: true,
  tags: ["polyvalent", "rapport-qualité-prix", "adaptable"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

// =====================================
// EXPORT DES DONNÉES
// =====================================

export const campaignBundles: CampaignBundle[] = [
  // Packs locaux
  localStarterPack,
  localMediumPack,

  // Packs régionaux
  regionalMediumPack,
  regionalPremiumPack,

  // Packs nationaux
  nationalPremiumPack,
  nationalEnterprisePack,

  // Packs universels
  universalStarterPack,
  universalMediumPack,
];

// Utilitaires pour filtrer les bundles
export const getBundlesByAudience = (audience: string) =>
  campaignBundles.filter((bundle) => bundle.targetAudience === audience);


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
  featured: getFeaturedBundles().length,
  active: getActiveBundles().length,
});
