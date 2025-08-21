/**
 * Types pour l'intégration Cloudinary
 */

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  bytes: number
  version: number
  url: string
  // Champs additionnels pour les thumbnails/preview générés
  thumbnail?: string
  preview?: string
}

export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'mpad'
  quality?: 'auto' | number
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif'
  gravity?: 'center' | 'face' | 'faces' | 'auto'
  background?: string
  overlay?: string
  effect?: string
}

export interface CloudinaryPreset {
  readonly thumbnail: CloudinaryTransformOptions
  readonly productMain: CloudinaryTransformOptions
  readonly logoUpload: CloudinaryTransformOptions
  readonly gallery: CloudinaryTransformOptions
  readonly avatar: CloudinaryTransformOptions
}