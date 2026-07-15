import { setCredentials } from '@/features/auth/authFlowSlice'
import { userApi } from '@/features/user/userApi'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlSuccess,
  flushLifecycle,
  mockFetch,
  parseGraphQLCall,
  teardownStore,
  seedRefreshToken,
  storedRefreshToken,
  TestStore,
} from '@/test-utils'

describe('userApi', () => {
  let fetchMock: jest.Mock
  let store: TestStore

  beforeEach(async () => {
    fetchMock = mockFetch()
    store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'access-1', refreshToken: 'refresh-1' })))
    await seedRefreshToken('refresh-1')
  })

  afterEach(async () => {
    await teardownStore(store)
    await clearStoredTokens()
  })

  describe('updateProfile', () => {
    it('sends only editable fields, never email or username', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({ updateProfile: { id: 'user-id' } }))

      await store.dispatch(
        userApi.endpoints.updateProfile.initiate({
          name: 'Ada',
          lastName: 'Lovelace',
          birthdate: '1990-12-10T00:00:00.000Z',
          profilePicture: 'https://example.com/pic.png',
          // even a hostile caller cannot sneak these through the types,
          // but assert the wire payload to be safe
          ...( { email: 'evil@example.com', username: 'evil' } as object),
        })
      ).unwrap()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.variables.input).toEqual({
        name: 'Ada',
        lastName: 'Lovelace',
        birthdate: '1990-12-10T00:00:00.000Z',
        profilePicture: 'https://example.com/pic.png',
      })
      expect(call.variables.input.email).toBeUndefined()
      expect(call.variables.input.username).toBeUndefined()
    })
  })

  describe('changePassword', () => {
    it('sends current and new passwords, then signs the user out', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        changePassword: { id: 'user-id', updatedAt: '2026-07-15T00:00:00.000Z' },
      }))

      await store.dispatch(
        userApi.endpoints.changePassword.initiate({
          currentPassword: 'old-secret',
          newPassword: 'new-secret',
        })
      ).unwrap()

      await flushLifecycle()

      const call = parseGraphQLCall(fetchMock.mock.calls[0])
      expect(call.variables.input).toEqual({
        currentPassword: 'old-secret',
        newPassword: 'new-secret',
      })
      expect(call.headers.authorization).toBe('Bearer access-1')

      // all sessions were revoked server-side: local state must be gone too
      expect(store.getState().auth.accessToken).toBeNull()
      expect(store.getState().auth.sessionStatus).toBe('unauthenticated')
      await expect(storedRefreshToken()).resolves.toBeNull()
    })
  })

  describe('me', () => {
    it('keeps the UUID id as a string', async () => {
      fetchMock.mockResolvedValueOnce(graphqlSuccess({
        me: {
          id: 'b3b8f9a0-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
          name: 'Ada',
          lastName: 'Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          birthdate: '1990-12-10T00:00:00.000Z',
          profilePicture: null,
          status: 'ACTIVE',
          emailVerifiedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }))

      const result = await store.dispatch(userApi.endpoints.me.initiate()).unwrap()

      expect(typeof result.id).toBe('string')
      expect(result.id).toBe('b3b8f9a0-1c2d-4e5f-8a9b-0c1d2e3f4a5b')
    })
  })
})
