import {
  beginEmailVerificationFlow,
  emailFromLoginIdentifier,
  identifierLooksLikeEmail,
} from '@/features/auth/verificationNavigation'
import { setVerificationFlow } from '@/features/auth/authFlowSlice'
import {
  clearStoredVerificationFlow,
  loadVerificationFlow,
} from '@/features/auth/verificationFlowStorage'
import { createTestStore } from '@/test-utils'

const mockReplace = jest.fn()

describe('verificationNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearStoredVerificationFlow()
  })

  it('detects email-shaped login identifiers', () => {
    expect(identifierLooksLikeEmail('user@example.com')).toBe(true)
    expect(identifierLooksLikeEmail('username')).toBe(false)
    expect(emailFromLoginIdentifier(' User@Example.com ')).toBe('user@example.com')
  })

  it('persists verification flow state and navigates to check-email', () => {
    const store = createTestStore()

    beginEmailVerificationFlow({
      dispatch: store.dispatch,
      router: { replace: mockReplace } as never,
      email: 'user@example.com',
      message: 'Confirm your email.',
    })

    expect(store.getState().auth.verificationEmail).toBe('user@example.com')
    expect(store.getState().auth.verificationMessage).toBe('Confirm your email.')
    expect(loadVerificationFlow()).toMatchObject({
      email: 'user@example.com',
      message: 'Confirm your email.',
      requestCodeOnEntry: true,
    })
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/check-email')
  })
})

describe('setVerificationFlow integration', () => {
  it('stores normalized email in redux', () => {
    const store = createTestStore()
    store.dispatch(setVerificationFlow({
      email: 'Ada@Example.com',
      message: 'Check your inbox.',
    }))

    expect(store.getState().auth.verificationEmail).toBe('Ada@Example.com')
  })
})
