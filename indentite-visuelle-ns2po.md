les "tokens" de design fondamentaux de la marque.

#### 🎨 Palette de Couleurs

La palette est à la fois chaleureuse, professionnelle et industrielle. Nous allons créer une palette sémantique (nommée par sa fonction).

- **Primaire (Ocre/Or) :** `~#C99A3B` - La couleur principale, chaleureuse et distinctive. Utilisée pour les fonds, les accents et l'identité.
- **Accent (Bourgogne) :** `~#6A2B3A` - Utilisée pour les blocs de texte importants, les titres et les appels à l'action. Inspire le sérieux et la confiance.
- **Fond Neutre (Blanc Cassé/Très clair) :** `~#F8F8F8` - Pour les arrière-plans généraux, plus doux qu'un blanc pur.
- **Texte Principal (Gris Foncé) :** `~#2D2D2D` - Un quasi-noir pour une lisibilité optimale sans être trop dur.
- **Sémantique - Sécurité (Jaune Vif) :** `~#F7DC00` - Inspiré du gilet de l'ouvrière. À utiliser pour les éléments liés aux EPI et à la sécurité.
- **Sémantique - Succès (Vert) :** `~#28a745` (standard) - Pour les messages de validation.
- **Sémantique - Erreur (Rouge) :** `~#dc3545` (standard) - Pour les messages d'erreur.

#### typography Typographie

La typographie est moderne, lisible et impactante.

- **Police des Titres (`font-heading`) :** Une police Sans Serif, grasse et légèrement condensée. **Poppins** ou **Montserrat** (disponibles sur Google Fonts) seraient d'excellents choix.
  - _Exemple :_ "POUR VOUS ACCOMPAGNER"
- **Police du Corps (`font-body`) :** Une police Sans Serif très lisible, avec une graisse normale. **Inter** ou **Roboto** seraient parfaits.
  - _Exemple :_ "Nous avons plusieurs solutions..."

#### 📐 Espacement, Bordures et Ombres

- **Rayon de bordure (`border-radius`) :** Les éléments ont des coins légèrement arrondis (le logo, les icônes en bas), ce qui donne une touche moderne et amicale. Nous utiliserons des valeurs cohérentes (ex: `4px`, `8px`).
- **Ombres (`box-shadow`) :** Les ombres doivent être subtiles pour donner de la profondeur sans surcharger l'interface.

---

### Étape 2 : Implémentation Technique (Tailwind CSS + Variables CSS)

La meilleure approche est de combiner la puissance de **Tailwind CSS** avec la flexibilité des **variables CSS natives**.

**Pourquoi cette approche ?**

- **Tailwind** nous donne les classes utilitaires pour construire rapidement l'interface (`bg-primary`, `text-body`).
- Les **variables CSS** sont la **source unique de vérité** pour nos tokens de design. Elles nous permettront de changer de thème dynamiquement (ex: Dark Mode) à l'avenir.

#### 1. Définir les variables CSS

Dans votre fichier CSS principal de l'application Nuxt (`/apps/election-mvp/assets/css/main.css`) :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Palette de Couleurs */
    --color-primary: 201 154 59; /* Format R G B pour l'opacité */
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
}
```

_Note : Nous utilisons les valeurs RGB pour pouvoir ensuite utiliser l'opacité avec Tailwind, ex: `bg-primary/50`._

#### 2. Configurer Tailwind CSS

Maintenant, nous allons apprendre à Tailwind à utiliser nos variables. Dans le fichier `tailwind.config.js` de l'application :

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // ... vos chemins de fichiers
  ],
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
      borderRadius: {
        sm: "var(--border-radius-sm)",
        md: "var(--border-radius-md)",
        lg: "var(--border-radius-lg)",
      },
    },
  },
  plugins: [],
};
```

#### 3. Utilisation dans un composant Vue

C'est là que la magie opère. Le développeur n'a plus à réfléchir aux couleurs, il utilise simplement les noms sémantiques.

````vue
<template>
  <div class="p-8 bg-background">
    <h1 class="font-heading text-4xl font-bold text-accent">
      Pour vous accompagner
    </h1>
    <p class="mt-4 font-body text-text-main">
      Nous avons plusieurs solutions en adéquation avec vos besoins.
    </p>
    <button
      class="mt-6 px-4 py-2 bg-primary text-white font-heading rounded-md hover:opacity-90"
    >
      Obtenir un devis
    </button>
  </div>
</template>
``` --- ### Étape 3 : Intégration dans le Monorepo Pour que ce thème soit
réutilisable par le futur site institutionnel ou le back-office, nous devons
l'extraire dans un package partagé. 1. **Créer un nouveau package `theme` :**
```bash # A la racine du monorepo mkdir packages/theme cd packages/theme pnpm
init ``` 2. **Contenu du package `theme` :** *
`packages/theme/tailwind-preset.js` : Ce fichier contiendra la configuration
`theme.extend` de Tailwind. * `packages/theme/styles.css` : Ce fichier
contiendra la définition des variables CSS (`:root`). 3. **Le preset Tailwind
(`tailwind-preset.js`) :** ```javascript // packages/theme/tailwind-preset.js
module.exports = { theme: { extend: { // ... toute la section 'extend' de notre
config précédente }, }, plugins: [], } ``` 4. **Utilisation dans une application
(`election-mvp`) :** Le `tailwind.config.js` de l'application devient beaucoup
plus simple : ```javascript // apps/election-mvp/tailwind.config.js /** @type
{import('tailwindcss').Config} */ export default { // On importe le preset
partagé presets: [require('@ns2po/theme/tailwind-preset')], content: [ // ...
chemins de l'application ], } ``` Il suffit également d'importer le fichier CSS
dans le `main.css` de l'application. --- ### Étape 4 : Vision pour l'Avenir et
Évolutions Cette architecture nous ouvre des possibilités très intéressantes.
#### Dark Mode Implémenter un mode sombre devient trivial. 1. **Activer dans
Tailwind :** ```javascript // tailwind.config.js export default { darkMode:
'class', // Active le mode sombre via une classe sur
<html>
  // ... } ```2. **Définir les variables du mode sombre dans `styles.css` :**
  ```css /* ... :root ... */ html.dark { --color-primary: 201 154 59; /* La
  primaire peut rester la même */ --color-accent: 120 60 80; /* Une version plus
  claire de l'accent */ --color-background: 45 45 45; --color-text-main: 248 248
  248; } ``` Et c'est tout ! L'ensemble de l'application basculera en mode
  sombre en ajoutant simplement la classe `dark` à la balise `
  <html>
    `. #### Thèmes Spécifiques (Ex: Thème Électoral) Pour le MVP, imaginez
    pouvoir adapter les couleurs du site à celles d'un parti politique
    spécifique pour une démonstration client. Vous pourriez créer des classes de
    thèmes qui redéfinissent les variables CSS. ```css /* dans un fichier
    theme-parti-bleu.css */ .theme-bleu { --color-primary: 29 78 216; /* Bleu */
    --color-accent: 185 28 28; /* Rouge */ }
  </html>
</html>
````

Un simple switch dans l'application pourrait appliquer cette classe au `body` pour re-thématiser l'ensemble du site à la volée, créant un effet "wow" pour le prospect.

### Plan d'Action pour l'Équipe Dev

1.  **Sprint 0/1 :** Créer le package `@ns2po/theme`.
2.  **Sprint 0/1 :** Définir les variables CSS et le preset Tailwind en se basant sur la charte graphique.
3.  **Sprint 0/1 :** Intégrer le thème dans l'application `election-mvp`.
4.  **Sprint 0/1 :** Mettre à jour **Storybook** pour qu'il utilise le thème, afin de construire les composants `ui` avec la bonne identité visuelle dès le départ.
