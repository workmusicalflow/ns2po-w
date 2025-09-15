/**
 * Configuration des Upload Presets Cloudinary pour NS2PO Assets
 * 
 * Ces presets doivent être créés dans le dashboard Cloudinary :
 * https://console.cloudinary.com/settings/upload
 */

export const CLOUDINARY_PRESETS = {
  // Produits : Optimisations pour catalogue e-commerce
  products: {
    preset: 'ns2po-products',
    config: {
      folder: 'ns2po/products',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
      format: 'auto',
      quality: 'auto:best',
      fetch_format: 'auto',
      // Transformations automatiques
      eager: [
        // Thumbnail pour catalogue
        { width: 300, height: 300, crop: 'fill', quality: 'auto:good' },
        // Preview produit
        { width: 800, height: 600, crop: 'fit', quality: 'auto:best' },
        // Mobile
        { width: 400, height: 400, crop: 'fill', quality: 'auto:good', format: 'webp' }
      ],
      // Invalidation automatique du cache
      invalidate: true,
      // Métadonnées personnalisées
      context: {
        category: 'product',
        project: 'ns2po-election-mvp'
      }
    }
  },

  // Logos : Préservation qualité maximale + formats multiples
  logos: {
    preset: 'ns2po-logos',
    config: {
      folder: 'ns2po/logos',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
      format: 'auto',
      quality: '100',
      // Support SVG et formats vectoriels
      allowed_formats: ['jpg', 'png', 'svg', 'webp'],
      eager: [
        // Logo standard
        { width: 500, height: 300, crop: 'fit', quality: '100' },
        // Logo petit (navbar, footer)
        { width: 150, height: 50, crop: 'fit', quality: '100' },
        // Logo grand (header, landing)
        { width: 1000, height: 400, crop: 'fit', quality: '100' }
      ],
      invalidate: true,
      context: {
        category: 'logo',
        project: 'ns2po-election-mvp'
      }
    }
  },

  // Backgrounds : Optimisation pour performance web
  backgrounds: {
    preset: 'ns2po-backgrounds',
    config: {
      folder: 'ns2po/backgrounds',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
      format: 'auto',
      quality: 'auto:good',
      eager: [
        // Desktop
        { width: 1920, height: 1080, crop: 'fill', quality: 'auto:good' },
        // Mobile
        { width: 768, height: 1024, crop: 'fill', quality: 'auto:good', format: 'webp' },
        // Thumbnail
        { width: 300, height: 200, crop: 'fill', quality: 'auto:eco' }
      ],
      invalidate: true,
      context: {
        category: 'background',
        project: 'ns2po-election-mvp'
      }
    }
  },

  // Icons : Formats multiples + optimisation SVG
  icons: {
    preset: 'ns2po-icons',
    config: {
      folder: 'ns2po/icons',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
      format: 'auto',
      quality: '100',
      allowed_formats: ['svg', 'png', 'jpg', 'webp'],
      eager: [
        // Icône standard
        { width: 64, height: 64, crop: 'fit', quality: '100' },
        // Icône petite (UI)
        { width: 24, height: 24, crop: 'fit', quality: '100' },
        // Icône grande (hero sections)
        { width: 128, height: 128, crop: 'fit', quality: '100' }
      ],
      invalidate: true,
      context: {
        category: 'icon',
        project: 'ns2po-election-mvp'
      }
    }
  }
};

/**
 * Configuration de base Cloudinary
 */
export const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dsrvzogof',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
};

/**
 * Mapping automatique : nom de fichier → preset approprié
 */
export function getPresetFromFilename(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.startsWith('textile-') || lower.startsWith('gadget-') || lower.startsWith('epi-')) {
    return CLOUDINARY_PRESETS.products;
  }
  
  if (lower.startsWith('logo-')) {
    return CLOUDINARY_PRESETS.logos;
  }
  
  if (lower.startsWith('bg-') || lower.startsWith('background-')) {
    return CLOUDINARY_PRESETS.backgrounds;
  }
  
  if (lower.startsWith('icon-')) {
    return CLOUDINARY_PRESETS.icons;
  }
  
  // Fallback vers produits
  return CLOUDINARY_PRESETS.products;
}

/**
 * Instructions pour créer les presets dans Cloudinary Dashboard
 */
export const PRESET_CREATION_INSTRUCTIONS = `
📋 INSTRUCTIONS - Création des Upload Presets Cloudinary

1. Se connecter à : https://console.cloudinary.com/settings/upload
2. Cliquer "Add upload preset"
3. Créer les 4 presets suivants :

🔸 ns2po-products
   - Signing Mode: Unsigned
   - Folder: ns2po/products
   - Use filename: Yes
   - Unique filename: No
   - Format: auto
   - Quality: auto:best
   - Eager transformations: 
     * c_fill,w_300,h_300,q_auto:good
     * c_fit,w_800,h_600,q_auto:best
     * c_fill,w_400,h_400,q_auto:good,f_webp

🔸 ns2po-logos  
   - Signing Mode: Unsigned
   - Folder: ns2po/logos
   - Use filename: Yes
   - Quality: 100
   - Allowed formats: jpg,png,svg,webp
   - Eager transformations:
     * c_fit,w_500,h_300,q_100
     * c_fit,w_150,h_50,q_100
     * c_fit,w_1000,h_400,q_100

🔸 ns2po-backgrounds
   - Signing Mode: Unsigned  
   - Folder: ns2po/backgrounds
   - Use filename: Yes
   - Quality: auto:good
   - Eager transformations:
     * c_fill,w_1920,h_1080,q_auto:good
     * c_fill,w_768,h_1024,q_auto:good,f_webp
     * c_fill,w_300,h_200,q_auto:eco

🔸 ns2po-icons
   - Signing Mode: Unsigned
   - Folder: ns2po/icons  
   - Use filename: Yes
   - Quality: 100
   - Allowed formats: svg,png,jpg,webp
   - Eager transformations:
     * c_fit,w_64,h_64,q_100
     * c_fit,w_24,h_24,q_100
     * c_fit,w_128,h_128,q_100
`;