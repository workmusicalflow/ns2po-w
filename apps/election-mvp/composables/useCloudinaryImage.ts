/**
 * Composable pour la gestion optimisée des images Cloudinary
 * Standardise les transformations et améliore les performances
 */

export interface CloudinaryImageOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'pad'
  gravity?: 'center' | 'face' | 'face:center' | 'auto' | 'north' | 'south' | 'east' | 'west'
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  effect?: string
  overlay?: string
  radius?: number | 'max'
  background?: string
}

export interface CloudinaryPreset {
  productCard: CloudinaryImageOptions
  realisationCard: CloudinaryImageOptions
  realisationHero: CloudinaryImageOptions
  thumbnail: CloudinaryImageOptions
  preview: CloudinaryImageOptions
  logo: CloudinaryImageOptions
  placeholder: CloudinaryImageOptions
}

export const useCloudinaryImage = () => {
  const config = useRuntimeConfig()
  const cloudName = config.public.cloudinaryCloudName

  /**
   * Presets d'optimisation par contexte d'usage
   */
  const presets: CloudinaryPreset = {
    // Cartes produits dans catalogue/grilles
    productCard: {
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto:good',
      format: 'auto'
    },
    
    // Cartes de réalisations
    realisationCard: {
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto:good',
      format: 'auto'
    },
    
    // Images héros de réalisations
    realisationHero: {
      width: 800,
      height: 600,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto:good',
      format: 'auto'
    },
    
    // Miniatures pour galeries
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'face:center',
      quality: 'auto:eco',
      format: 'auto'
    },
    
    // Prévisualisations haute qualité
    preview: {
      width: 1200,
      height: 900,
      crop: 'fit',
      gravity: 'center',
      quality: 'auto:best',
      format: 'auto'
    },
    
    // Logos utilisateur
    logo: {
      width: 300,
      height: 200,
      crop: 'fit',
      gravity: 'center',
      quality: 'auto:best',
      format: 'auto',
      background: 'transparent'
    },
    
    // Placeholders bas débit
    placeholder: {
      width: 50,
      height: 50,
      crop: 'fill',
      gravity: 'center',
      quality: 20,
      format: 'jpg',
      effect: 'blur:1000'
    }
  }

  /**
   * Génère une URL Cloudinary optimisée
   */
  const getOptimizedUrl = (
    publicId: string, 
    options: CloudinaryImageOptions = {},
    preset?: keyof CloudinaryPreset
  ): string => {
    if (!publicId || !cloudName) {
      return ''
    }

    // Application du preset si fourni
    const finalOptions = preset ? { ...presets[preset], ...options } : options

    // Construction des transformations
    const transformations: string[] = []

    if (finalOptions.width) transformations.push(`w_${finalOptions.width}`)
    if (finalOptions.height) transformations.push(`h_${finalOptions.height}`)
    if (finalOptions.crop) transformations.push(`c_${finalOptions.crop}`)
    if (finalOptions.gravity) transformations.push(`g_${finalOptions.gravity}`)
    if (finalOptions.quality) transformations.push(`q_${finalOptions.quality}`)
    if (finalOptions.format) transformations.push(`f_${finalOptions.format}`)
    if (finalOptions.effect) transformations.push(`e_${finalOptions.effect}`)
    if (finalOptions.radius) transformations.push(`r_${finalOptions.radius}`)
    if (finalOptions.background) transformations.push(`b_${finalOptions.background}`)
    if (finalOptions.overlay) transformations.push(`l_${finalOptions.overlay}`)

    const transformationString = transformations.join(',')
    
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`
  }

  /**
   * Génère une URL responsive avec plusieurs tailles
   */
  const getResponsiveUrls = (
    publicId: string,
    baseOptions: CloudinaryImageOptions = {},
    preset?: keyof CloudinaryPreset
  ) => {
    const breakpoints = [
      { suffix: 'sm', width: 300 },
      { suffix: 'md', width: 500 },
      { suffix: 'lg', width: 800 },
      { suffix: 'xl', width: 1200 }
    ]

    return breakpoints.reduce((acc, bp) => {
      acc[bp.suffix] = getOptimizedUrl(
        publicId,
        { ...baseOptions, width: bp.width },
        preset
      )
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Génère les attributs complets pour un élément img responsive
   */
  const getResponsiveProps = (
    publicId: string,
    preset: keyof CloudinaryPreset,
    alt: string,
    customOptions: CloudinaryImageOptions = {}
  ) => {
    const urls = getResponsiveUrls(publicId, customOptions, preset)
    const placeholderUrl = getOptimizedUrl(publicId, {}, 'placeholder')
    const mainUrl = getOptimizedUrl(publicId, customOptions, preset)

    return {
      src: mainUrl,
      srcset: Object.entries(urls)
        .map(([size, url]) => `${url} ${size === 'sm' ? '300w' : size === 'md' ? '500w' : size === 'lg' ? '800w' : '1200w'}`)
        .join(', '),
      sizes: '(max-width: 640px) 300px, (max-width: 768px) 500px, (max-width: 1024px) 800px, 1200px',
      alt,
      loading: 'lazy' as const,
      placeholder: placeholderUrl
    }
  }

  /**
   * Valide qu'un publicId Cloudinary est bien formé
   */
  const isValidPublicId = (publicId: string): boolean => {
    if (!publicId || typeof publicId !== 'string') return false
    
    // Format basique : pas de caractères interdits
    const invalidChars = /[<>:"\\|?*]/
    return !invalidChars.test(publicId) && publicId.length > 0
  }

  /**
   * Génère une URL pour superposition de logo sur produit
   */
  const getProductWithLogoUrl = (
    productPublicId: string,
    logoPublicId: string,
    options: {
      logoPosition?: 'center' | 'bottom-right' | 'top-left' | 'top-right'
      logoScale?: number
      productPreset?: keyof CloudinaryPreset
    } = {}
  ): string => {
    const {
      logoPosition = 'center',
      logoScale = 0.3,
      productPreset = 'preview'
    } = options

    // Position mapping pour l'overlay
    const positionMap = {
      center: 'center',
      'bottom-right': 'south_east',
      'top-left': 'north_west',
      'top-right': 'north_east'
    }

    const baseTransformations = Object.entries(presets[productPreset])
      .map(([key, value]) => {
        switch (key) {
          case 'width': return `w_${value}`
          case 'height': return `h_${value}`
          case 'crop': return `c_${value}`
          case 'gravity': return `g_${value}`
          case 'quality': return `q_${value}`
          case 'format': return `f_${value}`
          default: return null
        }
      })
      .filter(Boolean)
      .join(',')

    const logoOverlay = `l_${logoPublicId},w_${Math.round((presets[productPreset].width || 800) * logoScale)},g_${positionMap[logoPosition]}`

    return `https://res.cloudinary.com/${cloudName}/image/upload/${baseTransformations}/${logoOverlay}/${productPublicId}`
  }

  return {
    presets: readonly(presets),
    getOptimizedUrl,
    getResponsiveUrls,
    getResponsiveProps,
    getProductWithLogoUrl,
    isValidPublicId
  }
}