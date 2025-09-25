import { vi } from 'vitest'

export const mockReadBody = vi.fn()
export const mockSetResponseStatus = vi.fn()
export const mockCreateError = vi.fn()
export const mockGetMethod = vi.fn()

export const defineEventHandler = (handler: any) => handler
export const readBody = () => mockReadBody()
export const setResponseStatus = mockSetResponseStatus
export const createError = mockCreateError
export const getMethod = mockGetMethod