import { completeEmailVerification } from '@/features/auth/verificationCompletion'
import { persistLoginDataForSignUp, setCredentials } from '@/features/auth/authFlowSlice'
import { clearStoredVerificationFlow, saveVerificationFlow } from '@/features/auth/verificationFlowStorage'
import { createTestStore } from '@/test-utils'

const mockReplace = jest.fn()
const mockLogin = jest.fn()

const verifiedUser = {
  id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
  email: 'user@example.com',
  username: 'user',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-07-15T00:00:00.000Z',
}

const pendingUser = {
  id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
  email: 'user@example.com',
  username: 'user',
  status: 'PENDING_VERIFICATION' as const,
  emailVerifiedAt: null,
}

describe('completeEmailVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearStoredVerificationFlow()
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        user: verifiedUser,
      }),
    })
  })

  it('updates an authenticated pending session and routes to home', async () => {
    const store = createTestStore()
    store.dispatch(setCredentials({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
      user: pendingUser,
    }))
    saveVerificationFlow({
      email: 'user@example.com',
      message: 'Confirm your email.',
      resendAvailableAt: null,
    })

    const result = await completeEmailVerification({
      dispatch: store.dispatch,
      router: { replace: mockReplace } as never,
      verifiedUser,
      isAuthenticated: true,
      currentUser: pendingUser,
      pendingCredentials: null,
      login: mockLogin,
    })

    expect(result).toBe('home')
    expect(store.getState().auth.user?.status).toBe('ACTIVE')
    expect(store.getState().auth.verificationEmail).toBe('')
    expect(mockReplace).toHaveBeenCalledWith('/(home)')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('logs in with pending signup credentials after verification', async () => {
    const store = createTestStore()
    store.dispatch(persistLoginDataForSignUp({
      email: 'user@example.com',
      password: 'secret-password',
    }))

    const result = await completeEmailVerification({
      dispatch: store.dispatch,
      router: { replace: mockReplace } as never,
      verifiedUser,
      isAuthenticated: false,
      currentUser: null,
      pendingCredentials: {
        email: 'user@example.com',
        password: 'secret-password',
      },
      login: mockLogin,
    })

    expect(result).toBe('home')
    expect(mockLogin).toHaveBeenCalledWith({
      identifier: 'user@example.com',
      password: 'secret-password',
    })
    expect(store.getState().auth.signupEmail).toBe('')
    expect(mockReplace).toHaveBeenCalledWith('/(home)')
  })

  it('falls back to manual login when no session or credentials exist', async () => {
    const store = createTestStore()

    const result = await completeEmailVerification({
      dispatch: store.dispatch,
      router: { replace: mockReplace } as never,
      verifiedUser,
      isAuthenticated: false,
      currentUser: null,
      pendingCredentials: null,
      login: mockLogin,
    })

    expect(result).toBe('manual-login')
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
