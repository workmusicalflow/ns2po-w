/**
 * Types pour le formulaire admin ProductForm.vue
 * Pattern Adapter: Sépare clairement format API vs format Formulaire
 *
 * Résout le problème:
 * - API retourne materials: string[], colors: {name, hex?}[], sizes: {name, category?}[]
 * - Formulaire attend materials: string (textarea), colors: string[], sizes: string[]
 */

// ===== Format API (ce que retourne l'API) =====

export interface ProductColorFromApi {
  name: string
  hex?: string
}

export interface ProductSizeFromApi {
  name: string
  category?: 'XS-XL' | 'numeric' | 'custom'
}

export interface ProductGalleryFromApi {
  url: string
  type?: 'main' | 'variant' | 'detail'
}

/**
 * Structure du produit tel que retourné par GET /api/admin/products/:id
 */
export interface ProductFromApi {
  id: string
  name: string
  description: string
  reference: string
  category: string
  subcategory?: string
  basePrice: number
  minQuantity: number
  maxQuantity: number
  image_url?: string
  isActive: boolean

  // Relations normalisées (format API)
  materials: string[]
  colors: ProductColorFromApi[]
  sizes: ProductSizeFromApi[]
  gallery?: ProductGalleryFromApi[]
  tags?: string[]

  createdAt: string
  updatedAt: string
}

// ===== Format Formulaire (ce qu'utilise le composant Vue) =====

/**
 * Structure des données dans le formulaire ProductForm.vue
 * Optimisé pour les inputs HTML natifs
 */
export interface ProductFormData {
  name: string
  description: string
  reference: string
  category: string
  subcategory: string
  basePrice: number | null
  minQuantity: number
  maxQuantity: number
  imageUrl: string
  isActive: boolean

  // Format formulaire (strings pour textareas/inputs)
  materials: string      // textarea: "Coton\nPolyester\nNylon"
  colors: string[]       // array de noms: ["Rouge", "Bleu"]
  sizes: string[]        // array de noms: ["S", "M", "L"]

  // Données supplémentaires pour hex colors (optionnel)
  colorHexMap?: Record<string, string>  // {"Rouge": "#FF0000"}
}

/**
 * Valeurs par défaut pour un nouveau produit
 */
export function getDefaultFormData(): ProductFormData {
  return {
    name: '',
    description: '',
    reference: '',
    category: '',
    subcategory: '',
    basePrice: null,
    minQuantity: 10,
    maxQuantity: 1000,
    imageUrl: '',
    isActive: true,
    materials: '',
    colors: [''],
    sizes: [''],
    colorHexMap: {}
  }
}
