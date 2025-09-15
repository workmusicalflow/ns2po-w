import { ref, computed, watch, readonly } from "vue";

export type ThemeVariant =
  | "default"
  | "election-primary"
  | "election-secondary"
  | "dark";
export type ColorScheme = "light" | "dark";

interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    textMain: string;
    textSecondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    safety: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

const themes: Record<ThemeVariant, ThemeConfig> = {
  default: {
    name: "NS2PO Classic",
    colors: {
      primary: "#C99A3B", // Or/Ocre NS2PO (Officiel)
      accent: "#6A2B3A", // Bourgogne NS2PO (Officiel)
      background: "#F8F8F8", // Fond Neutre NS2PO (Officiel)
      surface: "#FFFFFF", // Blanc pur pour les cartes
      textMain: "#2D2D2D", // Texte Principal NS2PO (Officiel)
      textSecondary: "#6B7280", // Gris moyen
      success: "#28a745", // Vert NS2PO (Officiel)
      error: "#dc3545", // Rouge NS2PO (Officiel)
      warning: "#F59E0B",
      info: "#3B82F6",
      safety: "#F7DC00", // Jaune Vif NS2PO (Officiel)
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
  },
  "election-primary": {
    name: "Élection Primaire",
    colors: {
      primary: "#1E40AF", // Bleu institutionnel
      accent: "#DC2626", // Rouge politique
      background: "#F8FAFC",
      surface: "#FFFFFF",
      textMain: "#0F172A",
      textSecondary: "#475569",
      success: "#059669",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0284C7",
      safety: "#CA8A04",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
  },
  "election-secondary": {
    name: "Élection Alternative",
    colors: {
      primary: "#059669", // Vert espoir
      accent: "#7C3AED", // Violet modernité
      background: "#F0FDF4",
      surface: "#FFFFFF",
      textMain: "#14532D",
      textSecondary: "#16A34A",
      success: "#22C55E",
      error: "#EF4444",
      warning: "#EAB308",
      info: "#8B5CF6",
      safety: "#F59E0B",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
  },
  dark: {
    name: "Mode Sombre",
    colors: {
      primary: "#FCD34D", // Or plus lumineux pour le dark
      accent: "#F87171", // Rouge plus doux
      background: "#0F172A", // Noir bleuté
      surface: "#1E293B", // Gris foncé
      textMain: "#F8FAFC", // Blanc cassé
      textSecondary: "#94A3B8", // Gris clair
      success: "#34D399",
      error: "#F87171",
      warning: "#FBBF24",
      info: "#60A5FA",
      safety: "#FDE047",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
  },
};

// State global du thème
const currentTheme = ref<ThemeVariant>("default");
const colorScheme = ref<ColorScheme>("light");

export const useTheme = () => {
  const theme = computed(() => themes[currentTheme.value]);

  const setTheme = (newTheme: ThemeVariant) => {
    currentTheme.value = newTheme;
    applyThemeToDOM();
  };

  const toggleColorScheme = () => {
    colorScheme.value = colorScheme.value === "light" ? "dark" : "light";
    if (colorScheme.value === "dark") {
      setTheme("dark");
    } else {
      setTheme("default");
    }
  };

  const applyThemeToDOM = () => {
    const root = document.documentElement;
    const themeColors = theme.value.colors;

    // Fonction pour convertir HEX en RGB
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `${r} ${g} ${b}`; // Format RGB pour Tailwind avec opacité
      }
      return "0 0 0";
    };

    // Application des CSS custom properties au format RGB
    root.style.setProperty("--color-primary", hexToRgb(themeColors.primary));
    root.style.setProperty("--color-accent", hexToRgb(themeColors.accent));
    root.style.setProperty(
      "--color-background",
      hexToRgb(themeColors.background)
    );
    root.style.setProperty("--color-surface", hexToRgb(themeColors.surface));
    root.style.setProperty("--color-text-main", hexToRgb(themeColors.textMain));
    root.style.setProperty(
      "--color-text-secondary",
      hexToRgb(themeColors.textSecondary)
    );
    root.style.setProperty("--color-success", hexToRgb(themeColors.success));
    root.style.setProperty("--color-error", hexToRgb(themeColors.error));
    root.style.setProperty("--color-warning", hexToRgb(themeColors.warning));
    root.style.setProperty("--color-info", hexToRgb(themeColors.info));
    root.style.setProperty("--color-safety", hexToRgb(themeColors.safety));

    // Application de la classe de thème
    root.className = root.className.replace(/theme-\w+/g, "");
    root.classList.add(`theme-${currentTheme.value}`);
    root.classList.toggle("dark", colorScheme.value === "dark");
  };

  const getThemesList = () => {
    return Object.keys(themes).map((key) => ({
      value: key as ThemeVariant,
      name: themes[key as ThemeVariant].name,
    }));
  };

  // Auto-application du thème au montage
  watch([currentTheme, colorScheme], () => {
    if (process.client) {
      applyThemeToDOM();
    }
  });

  // Persistance dans localStorage
  const saveThemeToStorage = () => {
    if (process.client) {
      localStorage.setItem("ns2po-theme", currentTheme.value);
      localStorage.setItem("ns2po-color-scheme", colorScheme.value);
    }
  };

  const loadThemeFromStorage = () => {
    if (process.client) {
      const savedTheme = localStorage.getItem("ns2po-theme") as ThemeVariant;
      const savedColorScheme = localStorage.getItem(
        "ns2po-color-scheme"
      ) as ColorScheme;

      if (savedTheme && themes[savedTheme]) {
        currentTheme.value = savedTheme;
      }
      if (savedColorScheme) {
        colorScheme.value = savedColorScheme;
      }

      applyThemeToDOM();
    }
  };

  // Détection des préférences système
  const detectSystemColorScheme = () => {
    if (process.client && window.matchMedia) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      colorScheme.value = isDark ? "dark" : "light";
    }
  };

  return {
    // State
    currentTheme: readonly(currentTheme),
    colorScheme: readonly(colorScheme),
    theme,

    // Actions
    setTheme,
    toggleColorScheme,
    applyThemeToDOM,
    getThemesList,

    // Persistance
    saveThemeToStorage,
    loadThemeFromStorage,
    detectSystemColorScheme,
  };
};

// Plugin Nuxt pour l'initialisation automatique
export const initializeTheme = () => {
  if (process.client) {
    const { loadThemeFromStorage, detectSystemColorScheme, applyThemeToDOM } =
      useTheme();

    // Chargement des préférences
    detectSystemColorScheme();
    loadThemeFromStorage();
    applyThemeToDOM();
  }
};
