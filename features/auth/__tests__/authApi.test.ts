import { authApi } from '@/features/auth/authApi'
import { setCredentials } from '@/features/auth/authFlowSlice'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlError,
  graphqlSuccess,
  flushLifecycle,
  mockFetch,
  parseGraphQLCall,
  teardownStore,
  seedRefreshToken,
  storedRefreshToken,
  TestStore,
} from '@/test-utils'

describe('authApi', () => {
  let fetchMock: jest.Mock
  let store: TestStore

  beforeEach(async () => {
    fetchMock = mockFetch()
    store = createTestStore()
    await clearStoredTokens()
  })

  afterEach(async () => {
    await teardownStore(store)
  })

  describe('login', () => {
    it('sends identifier and password and stores both tokens and expiresIn', async () => {
      const payload = authPayloadFixture({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresIn: 900,
      })
      fetchMock.mockResolvedValueOnce(graphqlSuccess({ login: payload }))

      const result = await store.dispatch(
        authApi.endpoints.login.initiate({ identifier: 'user@example.com', password: 'secret' })
      ).unwrap()

      await flushLifecycle()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.variables.input).toEqual({ identifier: 'user@example.com', password: 'secret' })
      // login is anonymous: no stale token attached
      expect(call.headers.authorization).toBeUndefined()

      expect(result.user.id).toBe(payload.user.id)
      expect(typeof result.user.id).toBe('string')

      expect(store.getState().auth.accessToken).toBe('access-1')
      expect(store.getState().auth.expiresIn).toBe(900)
      await expect(storedRefreshToken()).resolves.toBe('refresh-1')
    })

    it('surfaces UNAUTHENTICATED failures without storing tokens', async () => {
      fetchMock.mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

      await expect(
        store.dispatch(
          authApi.endpoints.login.initiate({ identifier: 'user@example.com', password: 'wrong' })
        ).unwrap()
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })

      expect(store.getState().auth.accessToken).toBeNull()
      await expect(storedRefreshToken()).resolves.toBeNull()
    })
  })

  describe('createUser', () => {
    it('consumes only the generic message payload', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        createUser: { message: 'Check your email to verify your account.' },
      }))

      const result = await store.dispatch(
        authApi.endpoints.createUser.initiate({
          name: 'Ada',
          lastName: 'Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          password: 'secret-1',
          birthdate: '1990-12-10T00:00:00.000Z',
        })
      ).unwrap()

      expect(result).toEqual({ message: 'Check your email to verify your account.' })

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.query).toContain('mutation CreateUser')
      expect(call.variables.input.birthdate).toBe('1990-12-10T00:00:00.000Z')
      expect(call.headers.authorization).toBeUndefined()
    })
  })

  describe('restoreSession', () => {
    it('refreshes from the stored token and applies both rotated tokens', async () => {
      await seedRefreshToken('stored-refresh')
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'restored-access', refreshToken: 'rotated-refresh' }),
      }))

      await store.dispatch(authApi.endpoints.restoreSession.initiate()).unwrap()

      await flushLifecycle()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.query).toContain('mutation RefreshToken')
      expect(call.variables.input.refreshToken).toBe('stored-refresh')
      expect(call.headers.authorization).toBeUndefined()

      expect(store.getState().auth.sessionStatus).toBe('authenticated')
      expect(store.getState().auth.accessToken).toBe('restored-access')
      await expect(storedRefreshToken()).resolves.toBe('rotated-refresh')
    })

    it('clears auth state when the stored token is rejected', async () => {
      await seedRefreshToken('stored-refresh')
      fetchMock.mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

      await expect(
        store.dispatch(authApi.endpoints.restoreSession.initiate()).unwrap()
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })

      await flushLifecycle()

      expect(store.getState().auth.sessionStatus).toBe('unauthenticated')
      await expect(storedRefreshToken()).resolves.toBeNull()
    })
  })

  describe('logout', () => {
    it('sends the refresh token with the access token attached', async () => {
      store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'access-1', refreshToken: 'refresh-1' })))
      await seedRefreshToken('refresh-1')
      fetchMock.mockResolvedValueOnce(graphqlSuccess({ logout: { message: 'ok' } }))

      await store.dispatch(authApi.endpoints.logout.initiate()).unwrap()

      await flushLifecycle()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.query).toContain('mutation Logout')
      expect(call.variables.refreshToken).toBe('refresh-1')
      expect(call.headers.authorization).toBe('Bearer access-1')
    })

    it('clears local auth state even when the API call fails', async () => {
      store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'access-1', refreshToken: 'refresh-1' })))
      await seedRefreshToken('refresh-1')
      fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'))

      await expect(
        store.dispatch(authApi.endpoints.logout.initiate()).unwrap()
      ).rejects.toBeTruthy()

      await flushLifecycle()

      expect(store.getState().auth.accessToken).toBeNull()
      expect(store.getState().auth.sessionStatus).toBe('unauthenticated')
      await expect(storedRefreshToken()).resolves.toBeNull()
    })
  })

  describe('logoutAll', () => {
    it('requires the access token and clears local auth state after completion', async () => {
      store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'access-1' })))
      await seedRefreshToken('refresh-1')
      fetchMock.mockResolvedValueOnce(graphqlSuccess({ logoutAll: { message: 'ok' } }))

      await store.dispatch(authApi.endpoints.logoutAll.initiate()).unwrap()

      await flushLifecycle()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.query).toContain('mutation LogoutAll')
      expect(call.headers.authorization).toBe('Bearer access-1')

      expect(store.getState().auth.accessToken).toBeNull()
      await expect(storedRefreshToken()).resolves.toBeNull()
    })
  })

  describe('verifyEmail', () => {
    it('sends the normalized email and six-character code', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        verifyEmail: {
          id: 'b3b8f9a0-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
          email: 'user@example.com',
          username: 'user',
          status: 'ACTIVE',
          emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        },
      }))

      const result = await store.dispatch(
        authApi.endpoints.verifyEmail.initiate({
          email: 'user@example.com',
          code: '012345',
        })
      ).unwrap()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.variables.input).toEqual({
        email: 'user@example.com',
        code: '012345',
      })
      expect(result.status).toBe('ACTIVE')
      expect(call.headers.authorization).toBeUndefined()
    })

    it('resends verification with only the email', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        resendVerificationEmail: {
          message: 'If eligible, a new confirmation code has been sent.',
        },
      }))

      const result = await store.dispatch(
        authApi.endpoints.resendVerification.initiate({
          email: 'user@example.com',
        })
      ).unwrap()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.variables.input).toEqual({ email: 'user@example.com' })
      expect(call.variables.input).not.toHaveProperty('code')
      expect(result.message).toBe('If eligible, a new confirmation code has been sent.')
    })
  })

  describe('password reset flows', () => {
    it('requestPasswordReset returns the generic server message', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        requestPasswordReset: { message: 'If the email exists, a reset link was sent.' },
      }))

      const result = await store.dispatch(
        authApi.endpoints.requestPasswordReset.initiate({ email: 'user@example.com' })
      ).unwrap()

      expect(result.message).toBe('If the email exists, a reset link was sent.')
    })

    it('resetPassword sends token and newPassword', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        resetPassword: { message: 'Password updated.' },
      }))

      await store.dispatch(
        authApi.endpoints.resetPassword.initiate({ token: 'reset-token', newPassword: 'new-secret' })
      ).unwrap()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.variables.input).toEqual({ token: 'reset-token', newPassword: 'new-secret' })
    })
  })
})
