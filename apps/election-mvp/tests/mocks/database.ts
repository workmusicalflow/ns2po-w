import { vi } from 'vitest'

export const mockTursoClient = {
  execute: vi.fn()
}

export const getDatabase = vi.fn(() => mockTursoClient)