/**
 * Types pour la gestion des utilisateurs
 */

// === INFORMATIONS CLIENT ===
export interface CustomerInfo {
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  address?: CustomerAddress
  customerType?: CustomerType
  taxNumber?: string
}

export interface CustomerAddress {
  street: string
  line2?: string
  city: string
  region: string
  postalCode?: string
  country: string
}

export type CustomerType = 'individual' | 'party' | 'candidate' | 'organization'

export interface Utilisateur {
  readonly id: string
  readonly email: string
  readonly nom: string
  readonly prenom: string
  readonly role: RoleUtilisateur
  readonly statut: StatutUtilisateur
  readonly dateCreation: Date
  readonly derniereConnexion?: Date
  readonly permissions: readonly Permission[]
}

export interface Electeur {
  readonly id: string
  readonly numeroElecteur: string
  readonly nom: string
  readonly prenom: string
  readonly dateNaissance: Date
  readonly adresse: AdresseElecteur
  readonly bureauVoteId: string
  readonly statut: StatutElecteur
  readonly aVote: boolean
  readonly dateInscription: Date
}

export interface AdresseElecteur {
  readonly rue: string
  readonly ville: string
  readonly codePostal: string
  readonly region: string
  readonly pays: string
}

export interface SessionUtilisateur {
  readonly id: string
  readonly utilisateurId: string
  readonly token: string
  readonly dateCreation: Date
  readonly dateExpiration: Date
  readonly adresseIp: string
  readonly userAgent: string
}

// Enums
export const RoleUtilisateur = {
  ADMIN: 'ADMIN',
  MODERATEUR: 'MODERATEUR',
  OBSERVATEUR: 'OBSERVATEUR',
  ELECTEUR: 'ELECTEUR'
} as const

export const StatutUtilisateur = {
  ACTIF: 'ACTIF',
  INACTIF: 'INACTIF',
  SUSPENDU: 'SUSPENDU',
  BLOQUE: 'BLOQUE'
} as const

export const StatutElecteur = {
  INSCRIT: 'INSCRIT',
  SUSPENDU: 'SUSPENDU',
  RADIE: 'RADIE'
} as const

export const Permission = {
  GERER_ELECTIONS: 'GERER_ELECTIONS',
  GERER_CANDIDATS: 'GERER_CANDIDATS',
  GERER_ELECTEURS: 'GERER_ELECTEURS',
  VOIR_RESULTATS: 'VOIR_RESULTATS',
  VOTER: 'VOTER',
  MODERER_CONTENU: 'MODERER_CONTENU'
} as const

// Type unions
export type RoleUtilisateur = typeof RoleUtilisateur[keyof typeof RoleUtilisateur]
export type StatutUtilisateur = typeof StatutUtilisateur[keyof typeof StatutUtilisateur]
export type StatutElecteur = typeof StatutElecteur[keyof typeof StatutElecteur]
export type Permission = typeof Permission[keyof typeof Permission]