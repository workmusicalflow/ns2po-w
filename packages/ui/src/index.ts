/**
 * NS2PO UI Components Library
 * Export de tous les composants Vue.js réutilisables
 */

// Composants de base
export { default as Button } from "./components/Button.vue";
export { default as Input } from "./components/Input.vue";
export { default as Card } from "./components/Card.vue";
export { default as Table } from "./components/Table.vue";
export { default as StatusBadge } from "./components/StatusBadge.vue";

// Composants Bundle Selector pour campagnes électorales
export { default as BundleSelector } from "./components/BundleSelector.vue";
export { default as QuickCartCustomizer } from "./components/QuickCartCustomizer.vue";
export { default as PersistentSummary } from "./components/PersistentSummary.vue";

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
  CardPadding,
} from "@ns2po/types";
