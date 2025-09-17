import { z } from 'zod'

export const productSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  reference: z.string()
    .min(1, 'La référence est requise')
    .regex(/^[A-Z0-9-_]+$/, 'La référence ne peut contenir que des lettres majuscules, chiffres, tirets et underscores')
    .max(20, 'La référence ne peut pas dépasser 20 caractères'),

  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),

  category_id: z.string()
    .min(1, 'La catégorie est requise'),

  status: z.enum(['active', 'inactive', 'draft'], {
    errorMap: () => ({ message: 'Statut invalide' })
  }),

  price: z.number()
    .min(0, 'Le prix ne peut pas être négatif')
    .max(10000000, 'Le prix ne peut pas dépasser 10 000 000 XOF'),

  min_quantity: z.number()
    .int('La quantité minimum doit être un nombre entier')
    .min(1, 'La quantité minimum doit être au moins 1')
    .max(1000, 'La quantité minimum ne peut pas dépasser 1000')
    .optional()
    .default(1),

  weight: z.number()
    .min(0, 'Le poids ne peut pas être négatif')
    .max(50000, 'Le poids ne peut pas dépasser 50kg')
    .optional()
    .default(0),

  image_url: z.string()
    .url('URL d\'image invalide')
    .optional()
    .or(z.literal('')),

  // Champs pour les dimensions personnalisables
  customizable: z.boolean()
    .optional()
    .default(false),

  // Champs pour les couleurs disponibles
  colors: z.array(z.string())
    .optional()
    .default([]),

  // Matériaux
  materials: z.array(z.string())
    .optional()
    .default([]),

  // Temps de production en jours
  production_time: z.number()
    .int('Le temps de production doit être un nombre entier')
    .min(1, 'Le temps de production doit être au moins 1 jour')
    .max(365, 'Le temps de production ne peut pas dépasser 365 jours')
    .optional()
    .default(7),

  // SEO et métadonnées
  meta_title: z.string()
    .max(60, 'Le titre SEO ne peut pas dépasser 60 caractères')
    .optional(),

  meta_description: z.string()
    .max(160, 'La description SEO ne peut pas dépasser 160 caractères')
    .optional(),

  // Tags pour recherche
  tags: z.array(z.string())
    .optional()
    .default([])
})

export type ProductInput = z.infer<typeof productSchema>

// Schema pour la mise à jour (tous les champs optionnels sauf l'ID)
export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().min(1, 'L\'ID est requis')
})

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

// Schema pour les filtres de recherche
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  customizable: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sort_by: z.enum(['name', 'price', 'created_at', 'updated_at']).optional().default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20)
})

export type ProductFilters = z.infer<typeof productFiltersSchema>