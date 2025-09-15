/**
 * Types pour le système électoral NS2PO
 */

export interface Candidat {
  readonly id: string
  readonly nom: string
  readonly prenom: string
  readonly parti?: string
  readonly programme?: string
  readonly photo?: string
  readonly biographie?: string
  readonly dateCreation: Date
  readonly dateModification: Date
  readonly statut: StatutCandidat
}

export interface Vote {
  readonly id: string
  readonly electeurId: string
  readonly candidatId: string
  readonly dateVote: Date
  readonly bureauVote: string
  readonly signature: string // Signature cryptographique
  readonly statut: StatutVote
}

export interface ResultatElection {
  readonly id: string
  readonly electionId: string
  readonly candidatId: string
  readonly nombreVotes: number
  readonly pourcentage: number
  readonly dateCalcul: Date
}

export interface Election {
  readonly id: string
  readonly titre: string
  readonly description: string
  readonly dateDebut: Date
  readonly dateFin: Date
  readonly typeElection: TypeElection
  readonly statut: StatutElection
  readonly candidats: readonly string[] // IDs des candidats
  readonly resultats?: readonly ResultatElection[]
  readonly dateCreation: Date
  readonly dateModification: Date
}

export interface BureauVote {
  readonly id: string
  readonly nom: string
  readonly adresse: string
  readonly responsable: string
  readonly capaciteMax: number
  readonly electeursInscrits: number
  readonly statut: StatutBureau
}

// Enums
export const StatutCandidat = {
  ACTIF: 'ACTIF',
  INACTIF: 'INACTIF', 
  SUSPENDU: 'SUSPENDU'
} as const

export const StatutVote = {
  VALIDE: 'VALIDE',
  INVALIDE: 'INVALIDE',
  CONTESTE: 'CONTESTE'
} as const

export const TypeElection = {
  PRESIDENTIELLE: 'PRESIDENTIELLE',
  LEGISLATIVE: 'LEGISLATIVE', 
  MUNICIPALE: 'MUNICIPALE',
  REGIONALE: 'REGIONALE'
} as const

export const StatutElection = {
  PREPARATION: 'PREPARATION',
  EN_COURS: 'EN_COURS',
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE'
} as const

export const StatutBureau = {
  OUVERT: 'OUVERT',
  FERME: 'FERME',
  MAINTENANCE: 'MAINTENANCE'
} as const

// Type unions
export type StatutCandidat = typeof StatutCandidat[keyof typeof StatutCandidat]
export type StatutVote = typeof StatutVote[keyof typeof StatutVote]
export type TypeElection = typeof TypeElection[keyof typeof TypeElection]
export type StatutElection = typeof StatutElection[keyof typeof StatutElection]
export type StatutBureau = typeof StatutBureau[keyof typeof StatutBureau]