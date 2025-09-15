/**
 * ESLint Configuration Optimisée pour Performance
 * Configuration spécifique pour améliorer la performance des hooks automatiques
 */

module.exports = {
  // Configuration de cache pour performance
  cache: true,
  cacheLocation: ".eslintcache",

  // Extensions de fichiers traitées
  extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],

  // Environnements globaux
  env: {
    node: true,
    browser: true,
    es6: true,
    commonjs: true,
  },

  // Variables globales
  globals: {
    module: "readonly",
    exports: "readonly",
    require: "readonly",
  },

  // Règles optimisées pour le développement rapide
  rules: {
    // Rules critiques uniquement (bloqueuses)
    "no-unused-vars": "error",
    "no-undef": "error",
    "no-redeclare": "error",

    // TypeScript rules essentielles
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",

    // Vue rules essentielles
    "vue/no-unused-components": "warn",
    "vue/no-unused-vars": "warn",
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "off",

    // Désactiver les rules de style (Prettier s'en charge)
    indent: "off",
    semi: "off",
    quotes: "off",
    "comma-dangle": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "array-bracket-spacing": "off",
  },

  // Ignorer les fichiers pour performance
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".nuxt/",
    ".output/",
    ".turbo/",
    "*.d.ts",
    "coverage/",
  ],
};
