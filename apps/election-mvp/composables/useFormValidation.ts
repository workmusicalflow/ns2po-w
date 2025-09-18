/**
 * Form validation composable using Zod schemas
 * Provides client-side validation for all CRUD forms
 */

import { z } from 'zod'
import { globalNotifications } from '~/composables/useNotifications'

// Import all schemas
import { campaignBundleSchema } from '~/schemas/bundle'
import { productSchema } from '~/schemas/product'
import { createCategorySchema, updateCategorySchema } from '~/schemas/category'
import { createRealisationSchema, updateRealisationSchema } from '~/schemas/realisation'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  success: boolean
  errors: ValidationError[]
  data?: any
}

export interface FormValidationOptions {
  showNotifications?: boolean
  notificationType?: 'error' | 'warning'
}

export const useFormValidation = () => {
  const { crudError } = globalNotifications

  // Generic validation function
  const validateWithSchema = <T>(
    schema: z.ZodSchema<T>,
    data: any,
    options: FormValidationOptions = {}
  ): ValidationResult => {
    const { showNotifications = false, notificationType = 'error' } = options

    try {
      const validatedData = schema.parse(data)
      return {
        success: true,
        errors: [],
        data: validatedData
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))

        if (showNotifications) {
          const errorMessage = errors.length === 1
            ? errors[0].message
            : `${errors.length} erreurs de validation détectées`

          if (notificationType === 'error') {
            crudError.validation(errorMessage)
          }
        }

        return {
          success: false,
          errors,
          data: null
        }
      }

      // Unexpected error
      const unknownError = 'Erreur de validation inattendue'
      if (showNotifications) {
        crudError.validation(unknownError)
      }

      return {
        success: false,
        errors: [{ field: 'general', message: unknownError }],
        data: null
      }
    }
  }

  // Specific validation functions for each entity
  const validateBundle = (data: any, options?: FormValidationOptions) => {
    return validateWithSchema(campaignBundleSchema, data, options)
  }

  const validateProduct = (data: any, options?: FormValidationOptions) => {
    return validateWithSchema(productSchema, data, options)
  }

  const validateCategory = (data: any, isUpdate: boolean = false, options?: FormValidationOptions) => {
    const schema = isUpdate ? updateCategorySchema : createCategorySchema
    return validateWithSchema(schema, data, options)
  }

  const validateRealisation = (data: any, isUpdate: boolean = false, options?: FormValidationOptions) => {
    const schema = isUpdate ? updateRealisationSchema : createRealisationSchema
    return validateWithSchema(schema, data, options)
  }

  // Field-level validation for real-time feedback
  const validateField = <T>(
    schema: z.ZodSchema<T>,
    fieldPath: string,
    value: any,
    formData: any = {}
  ): { isValid: boolean; error?: string } => {
    try {
      // Create a partial object with just this field for validation
      const testData = { ...formData, [fieldPath]: value }
      const result = schema.safeParse(testData)

      if (result.success) {
        return { isValid: true }
      }

      // Find error specific to this field
      const fieldError = result.error.errors.find(err =>
        err.path.join('.') === fieldPath
      )

      return {
        isValid: false,
        error: fieldError?.message || 'Valeur invalide'
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Erreur de validation'
      }
    }
  }

  // Reactive form validation composable
  const useReactiveValidation = <T>(schema: z.ZodSchema<T>) => {
    const errors = ref<Record<string, string>>({})
    const isValid = ref(false)
    const isValidating = ref(false)

    const validateForm = async (data: any): Promise<ValidationResult> => {
      isValidating.value = true
      errors.value = {}

      try {
        const result = validateWithSchema(schema, data)

        if (!result.success) {
          // Map errors to reactive object
          result.errors.forEach(error => {
            errors.value[error.field] = error.message
          })
        }

        isValid.value = result.success
        return result
      } finally {
        isValidating.value = false
      }
    }

    const validateFieldReactive = (fieldPath: string, value: any, formData: any = {}) => {
      const result = validateField(schema, fieldPath, value, formData)

      if (result.isValid) {
        delete errors.value[fieldPath]
      } else {
        errors.value[fieldPath] = result.error || 'Valeur invalide'
      }

      return result
    }

    const clearErrors = () => {
      errors.value = {}
      isValid.value = false
    }

    const clearFieldError = (fieldPath: string) => {
      delete errors.value[fieldPath]
    }

    return {
      errors: readonly(errors),
      isValid: readonly(isValid),
      isValidating: readonly(isValidating),
      validateForm,
      validateField: validateFieldReactive,
      clearErrors,
      clearFieldError
    }
  }

  // Form state management with validation
  const useValidatedForm = <T>(schema: z.ZodSchema<T>, initialData: any = {}) => {
    const formData = reactive({ ...initialData })
    const { errors, isValid, isValidating, validateForm, validateField, clearErrors, clearFieldError } = useReactiveValidation(schema)

    const updateField = (fieldPath: string, value: any) => {
      // Update form data
      const keys = fieldPath.split('.')
      let current = formData
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value

      // Validate field
      validateField(fieldPath, value, formData)
    }

    const resetForm = (newData: any = {}) => {
      // Clear current data
      Object.keys(formData).forEach(key => {
        delete formData[key]
      })

      // Set new data
      Object.assign(formData, newData)

      // Clear errors
      clearErrors()
    }

    const submitForm = async (): Promise<ValidationResult> => {
      return await validateForm(formData)
    }

    return {
      formData: readonly(formData),
      errors,
      isValid,
      isValidating,
      updateField,
      validateForm: submitForm,
      resetForm,
      clearErrors,
      clearFieldError
    }
  }

  // Utility functions for common validation patterns
  const validateRequired = (value: any, fieldName: string = 'Ce champ') => {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, error: `${fieldName} est requis` }
    }
    return { isValid: true }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format d\'email invalide' }
    }
    return { isValid: true }
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return { isValid: false, error: 'URL invalide' }
    }
  }

  const validateMinLength = (value: string, minLength: number, fieldName: string = 'Ce champ') => {
    if (value.length < minLength) {
      return { isValid: false, error: `${fieldName} doit contenir au moins ${minLength} caractères` }
    }
    return { isValid: true }
  }

  const validateMaxLength = (value: string, maxLength: number, fieldName: string = 'Ce champ') => {
    if (value.length > maxLength) {
      return { isValid: false, error: `${fieldName} ne peut pas dépasser ${maxLength} caractères` }
    }
    return { isValid: true }
  }

  return {
    // Core validation functions
    validateWithSchema,
    validateField,

    // Entity-specific validators
    validateBundle,
    validateProduct,
    validateCategory,
    validateRealisation,

    // Reactive validation composables
    useReactiveValidation,
    useValidatedForm,

    // Utility validators
    validateRequired,
    validateEmail,
    validateUrl,
    validateMinLength,
    validateMaxLength
  }
}