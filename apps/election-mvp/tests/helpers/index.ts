// Export principal des helpers de test
export * from './bundle-factory'
export { resetTestDatabase, createTestData } from '../setup'

// Helpers utilitaires pour tests
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const expectToThrow = async (fn: () => Promise<any>, errorMessage?: string) => {
  try {
    await fn()
    throw new Error('Expected function to throw but it did not')
  } catch (error) {
    if (errorMessage && !error.message.includes(errorMessage)) {
      throw new Error(`Expected error message to include "${errorMessage}" but got "${error.message}"`)
    }
  }
}

// Mock helpers pour API calls
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ data, success: true })
})

export const mockErrorResponse = (status: number, message: string) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message, success: false })
})
