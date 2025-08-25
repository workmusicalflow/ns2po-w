<template>
  <div class="flex items-center gap-3">
    <!-- Theme selector -->
    <NSMenu position="left" class="z-50">
      <template #trigger="{ open }">
        <NSButton variant="outline" size="sm">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5zM21 15a2 2 0 00-2-2h-4a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2z" />
          </svg>
          {{ currentThemeName }}
          <svg 
            class="ml-2 h-4 w-4 transition-transform" 
            :class="{ 'rotate-180': open }" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </NSButton>
      </template>
      
      <NSMenuItem 
        v-for="themeOption in themesList" 
        :key="themeOption.value"
        :class="{ 'bg-primary/10 text-primary': currentTheme === themeOption.value }"
        @click="handleThemeChange(themeOption.value)"
      >
        <div class="flex items-center">
          <div 
            class="w-3 h-3 rounded-full mr-3 border"
            :style="{ backgroundColor: getThemePreviewColor(themeOption.value) }"
          />
          {{ themeOption.name }}
          <svg 
            v-if="currentTheme === themeOption.value" 
            class="ml-auto w-4 h-4" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </NSMenuItem>
    </NSMenu>

    <!-- Color scheme toggle -->
    <NSButton 
      variant="ghost" 
      size="sm"
      :title="colorScheme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'"
      @click="handleColorSchemeToggle"
    >
      <svg 
        v-if="colorScheme === 'light'" 
        class="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg 
        v-else 
        class="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </NSButton>

    <!-- Theme preview indicator -->
    <div 
      class="flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-text-main/20"
      :title="`Thème actuel: ${currentThemeName}`"
    >
      <div 
        class="w-2 h-2 rounded-full" 
        :style="{ backgroundColor: theme.colors.primary }"
      />
      <div 
        class="w-2 h-2 rounded-full" 
        :style="{ backgroundColor: theme.colors.accent }"
      />
      <div 
        class="w-2 h-2 rounded-full border border-text-main/30" 
        :style="{ backgroundColor: theme.colors.background }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/composables/useTheme'
import type { ThemeVariant } from '~/composables/useTheme'

const { 
  currentTheme, 
  colorScheme, 
  theme,
  setTheme, 
  toggleColorScheme, 
  getThemesList, 
  saveThemeToStorage 
} = useTheme()

const themesList = computed(() => getThemesList())
const currentThemeName = computed(() => theme.value.name)

const handleThemeChange = (newTheme: ThemeVariant) => {
  setTheme(newTheme)
  saveThemeToStorage()
}

const handleColorSchemeToggle = () => {
  toggleColorScheme()
  saveThemeToStorage()
}

const getThemePreviewColor = (themeValue: ThemeVariant) => {
  const themePreviewColors = {
    'default': '#D4AF37',
    'election-primary': '#1E40AF',
    'election-secondary': '#059669',
    'dark': '#FCD34D'
  }
  return themePreviewColors[themeValue] || themePreviewColors.default
}
</script>