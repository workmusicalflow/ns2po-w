# 🎨 Identité Visuelle & Design System NS2PO

## Palette de Couleurs Officielle

### Couleurs de Marque
- **Primaire (Ocre/Or)** : `#C99A3B` - Couleur principale, chaleureuse et distinctive
- **Accent (Bourgogne)** : `#6A2B3A` - Titres, CTA, inspire sérieux et confiance
- **Fond Neutre** : `#F8F8F8` - Arrière-plans, plus doux qu'un blanc pur
- **Texte Principal** : `#2D2D2D` - Quasi-noir pour lisibilité optimale

### Couleurs Sémantiques
- **Sécurité (Jaune Vif)** : `#F7DC00` - Éléments EPI et sécurité
- **Succès (Vert)** : `#28a745` - Messages de validation
- **Erreur (Rouge)** : `#dc3545` - Messages d'erreur

## Typographie

- **Police Titres (`font-heading`)** : **Poppins** - Sans Serif grasse et condensée
- **Police Corps (`font-body`)** : **Inter** - Sans Serif très lisible

## Design Tokens Architecture

```css
:root {
  /* Palette RGB pour opacité Tailwind */
  --color-primary: 201 154 59;
  --color-accent: 106 43 58;
  --color-background: 248 248 248;
  --color-text-main: 45 45 45;
  --color-safety: 247 220 0;

  /* Typographie */
  --font-family-heading: "Poppins", sans-serif;
  --font-family-body: "Inter", sans-serif;

  /* Bordures */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
}
```

## Configuration Tailwind Customisée

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        "text-main": "rgb(var(--color-text-main) / <alpha-value>)",
        safety: "rgb(var(--color-safety) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-family-heading)"],
        body: ["var(--font-family-body)"],
      },
    },
  },
};
```

## Composants UI Principaux

### Composants NS2PO
- `NSButton.vue` : Bouton avec variantes brand
- `NSCard.vue` : Carte avec styles NS2PO
- `NSElectionProductCard.vue` : Carte produit électorale
- `NSInput.vue` : Champ de formulaire stylisé
- `NSMenu.vue` : Menu de navigation
- `NSMenuItem.vue` : Item de menu
- `NSModal.vue` : Modal réutilisable
- `NSThemeSwitcher.vue` : Sélecteur de thème

### Guidelines de Design

1. **Cohérence** : Utiliser les tokens de design partout
2. **Accessibilité** : WCAG AA minimum
3. **Mobile-first** : Design d'abord pour mobile
4. **Performance** : Images optimisées via Cloudinary
5. **Animation** : Subtiles et respectueuses de prefers-reduced-motion