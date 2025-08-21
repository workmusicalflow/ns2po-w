/**
 * NS2PO UI Components Library
 * Export de tous les composants Vue.js réutilisables
 */

// Composants de base
export { default as Button } from './components/Button.vue'
export { default as Input } from './components/Input.vue'
export { default as Card } from './components/Card.vue'
export { default as Table } from './components/Table.vue'

// Types pour une meilleure compatibilité TypeScript
export type { 
  ButtonProps, 
  InputProps,
  CardProps,
  TableProps,
  ButtonVariant,
  ButtonSize,
  InputType,
  CardVariant,
  CardPadding
} from '@ns2po/types'