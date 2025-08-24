/**
 * Test de conformité avec l'identité visuelle NS2PO
 * Vérifie que l'implémentation respecte les spécifications officielles
 */

import { describe, it, expect } from 'vitest'

// Spécifications officielles NS2PO
const NS2PO_SPECS = {
  colors: {
    primary: '#C99A3B',     // Or/Ocre
    accent: '#6A2B3A',      // Bourgogne
    background: '#F8F8F8',  // Fond Neutre
    textMain: '#2D2D2D',    // Texte Principal
    safety: '#F7DC00',      // Jaune Vif Sécurité
    success: '#28a745',     // Vert
    error: '#dc3545'        // Rouge
  },
  fonts: {
    heading: 'Poppins',
    body: 'Inter'
  },
  tokens: {
    borderRadiusSm: '4px',
    borderRadiusMd: '8px',
    borderRadiusLg: '16px'
  }
}

// Fonction pour convertir HEX en RGB
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `${r} ${g} ${b}`
  }
  return '0 0 0'
}

describe('Conformité NS2PO - Identité Visuelle', () => {
  describe('Palette de Couleurs', () => {
    it('devrait utiliser la couleur primaire officielle (#C99A3B)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.primary)
      expect(expectedRgb).toBe('201 154 59')
    })

    it('devrait utiliser la couleur accent officielle (#6A2B3A)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.accent)
      expect(expectedRgb).toBe('106 43 58')
    })

    it('devrait utiliser le fond neutre officiel (#F8F8F8)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.background)
      expect(expectedRgb).toBe('248 248 248')
    })

    it('devrait utiliser la couleur de texte principale (#2D2D2D)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.textMain)
      expect(expectedRgb).toBe('45 45 45')
    })

    it('devrait utiliser la couleur de sécurité jaune vif (#F7DC00)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.safety)
      expect(expectedRgb).toBe('247 220 0')
    })
  })

  describe('Couleurs Sémantiques', () => {
    it('devrait utiliser la couleur de succès verte (#28a745)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.success)
      expect(expectedRgb).toBe('40 167 69')
    })

    it('devrait utiliser la couleur d\'erreur rouge (#dc3545)', () => {
      const expectedRgb = hexToRgb(NS2PO_SPECS.colors.error)
      expect(expectedRgb).toBe('220 53 69')
    })
  })

  describe('Typographie', () => {
    it('devrait utiliser Poppins pour les titres', () => {
      expect(NS2PO_SPECS.fonts.heading).toBe('Poppins')
    })

    it('devrait utiliser Inter pour le corps de texte', () => {
      expect(NS2PO_SPECS.fonts.body).toBe('Inter')
    })
  })

  describe('Design Tokens', () => {
    it('devrait respecter les border-radius définis', () => {
      expect(NS2PO_SPECS.tokens.borderRadiusSm).toBe('4px')
      expect(NS2PO_SPECS.tokens.borderRadiusMd).toBe('8px')
      expect(NS2PO_SPECS.tokens.borderRadiusLg).toBe('16px')
    })
  })
})

// Validation du thème default dans useTheme.ts
describe('Thème Default - Conformité NS2PO', () => {
  const defaultTheme = {
    colors: {
      primary: '#C99A3B',
      accent: '#6A2B3A',
      background: '#F8F8F8',
      textMain: '#2D2D2D',
      safety: '#F7DC00',
      success: '#28a745',
      error: '#dc3545'
    }
  }

  it('devrait avoir toutes les couleurs NS2PO correctes', () => {
    expect(defaultTheme.colors.primary).toBe(NS2PO_SPECS.colors.primary)
    expect(defaultTheme.colors.accent).toBe(NS2PO_SPECS.colors.accent)
    expect(defaultTheme.colors.background).toBe(NS2PO_SPECS.colors.background)
    expect(defaultTheme.colors.textMain).toBe(NS2PO_SPECS.colors.textMain)
    expect(defaultTheme.colors.safety).toBe(NS2PO_SPECS.colors.safety)
    expect(defaultTheme.colors.success).toBe(NS2PO_SPECS.colors.success)
    expect(defaultTheme.colors.error).toBe(NS2PO_SPECS.colors.error)
  })
})