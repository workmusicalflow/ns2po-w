/**
 * Types pour les composants UI
 */

import type { SortOrder, PaginationParams } from './system'

export interface ButtonProps {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly type?: ButtonType
}

export interface InputProps {
  readonly id?: string
  readonly type?: InputType
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly readonly?: boolean
  readonly required?: boolean
  readonly error?: string
  readonly label?: string
}

export interface ModalProps {
  readonly open: boolean
  readonly title?: string
  readonly size?: ModalSize
  readonly closable?: boolean
  readonly onClose?: () => void
}

export interface TableColumn<T = unknown> {
  readonly key: keyof T
  readonly label: string
  readonly sortable?: boolean
  readonly width?: string
  readonly align?: 'left' | 'center' | 'right'
  readonly render?: (value: unknown, row: T) => string
  readonly component?: any
  readonly componentProps?: (value: unknown, row: T) => Record<string, any>
}

export interface TableProps<T = unknown> {
  readonly columns: readonly TableColumn<T>[]
  readonly data: readonly T[]
  readonly loading?: boolean
  readonly pagination?: PaginationParams
  readonly onSort?: (column: keyof T, order: SortOrder) => void
  readonly onPageChange?: (page: number) => void
}

export interface NotificationProps {
  readonly id: string
  readonly type: NotificationType
  readonly title: string
  readonly message?: string
  readonly duration?: number
  readonly actions?: readonly NotificationAction[]
}

export interface NotificationAction {
  readonly label: string
  readonly action: () => void
  readonly variant?: ButtonVariant
}

export interface FormFieldProps {
  readonly name: string
  readonly label?: string
  readonly required?: boolean
  readonly error?: string
  readonly help?: string
}

export interface CardProps {
  readonly variant?: CardVariant
  readonly padding?: CardPadding
  readonly shadow?: boolean
  readonly bordered?: boolean
  readonly rounded?: boolean
  readonly hoverable?: boolean
}

export const CardVariant = {
  default: 'default',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger'
} as const

export const CardPadding = {
  none: 'none',
  small: 'small',
  medium: 'medium',
  large: 'large'
} as const

export type CardVariant = typeof CardVariant[keyof typeof CardVariant]
export type CardPadding = typeof CardPadding[keyof typeof CardPadding]

// Enums
export const ButtonVariant = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  outline: 'outline'
} as const

export const ButtonSize = {
  small: 'small',
  medium: 'medium',
  large: 'large'
} as const

export const ButtonType = {
  button: 'button',
  submit: 'submit',
  reset: 'reset'
} as const

export const InputType = {
  text: 'text',
  email: 'email',
  password: 'password',
  number: 'number',
  date: 'date',
  textarea: 'textarea',
  select: 'select'
} as const

export const ModalSize = {
  small: 'small',
  medium: 'medium',
  large: 'large',
  full: 'full'
} as const

export const NotificationType = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info'
} as const

// Type unions
export type ButtonVariant = typeof ButtonVariant[keyof typeof ButtonVariant]
export type ButtonSize = typeof ButtonSize[keyof typeof ButtonSize]
export type ButtonType = typeof ButtonType[keyof typeof ButtonType]
export type InputType = typeof InputType[keyof typeof InputType]
export type ModalSize = typeof ModalSize[keyof typeof ModalSize]
export type NotificationType = typeof NotificationType[keyof typeof NotificationType]

