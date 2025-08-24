import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'node_modules/**',
      '*.d.ts',
      '.turbo/**'
    ]
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.vue',
      '**/*.js',
      '**/*.jsx'
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        $fetch: 'readonly',
        useRuntimeConfig: 'readonly',
        navigateTo: 'readonly',
        useRouter: 'readonly',
        useRoute: 'readonly',
        useState: 'readonly',
        useCookie: 'readonly',
        useHead: 'readonly',
        useSeoMeta: 'readonly',
        definePageMeta: 'readonly',
        defineNuxtComponent: 'readonly',
        defineNuxtPlugin: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        useNuxtApp: 'readonly',
        useFetch: 'readonly',
        createError: 'readonly',
        showError: 'readonly',
        clearError: 'readonly',
        isNuxt3: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Nitro/H3 server globals
        defineEventHandler: 'readonly',
        getQuery: 'readonly',
        getRouterParam: 'readonly',
        getRouterParams: 'readonly',
        readBody: 'readonly',
        readMultipartFormData: 'readonly',
        setResponseHeader: 'readonly',
        setResponseHeaders: 'readonly',
        getRequestHeader: 'readonly',
        getRequestHeaders: 'readonly',
        sendRedirect: 'readonly',
        // Nuxt config
        defineNuxtConfig: 'readonly',
        // Node.js globals
        require: 'readonly',
        global: 'readonly',
        // Custom composables
        useCloudinaryImage: 'readonly',
        useCloudinary: 'readonly',
        useContactForm: 'readonly',
        useDatabase: 'readonly',
        useCustomers: 'readonly',
        useOrders: 'readonly',
        usePaymentInstructions: 'readonly',
        useProducts: 'readonly',
        useQuoteCalculator: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      vue: pluginVue
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/max-attributes-per-line': 'off'
    }
  },
  // Configuration spécifique pour les scripts Node.js
  {
    files: [
      'scripts/**/*.{js,mjs}',
      'scripts/**/*.{js,ts}'
    ],
    languageOptions: {
      globals: {
        require: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      },
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'no-console': 'off'
    }
  },
  // Configuration spécifique pour les tests Vitest
  {
    files: [
      'tests/**/*.{js,ts}',
      '**/*.test.{js,ts}',
      '**/*.spec.{js,ts}'
    ],
    languageOptions: {
      globals: {
        global: 'readonly',
        Buffer: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly'
      }
    }
  }
]