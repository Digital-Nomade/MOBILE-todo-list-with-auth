import { setOfflineSession } from '@/features/auth/authFlowSlice'
import { __resetRefreshSessionForTests } from '@/features/auth/refreshSession'
import { bootstrapSession, reconnectOfflineSession } from '@/features/auth/sessionBootstrap'
import { saveCachedUser } from '@/features/auth/userCacheStorage'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlError,
  graphqlSuccess,
  mockFetch,
  seedRefreshToken,
  teardownStore,
} from '@/test-utils'
import NetInfo from '@react-native-community/netinfo'

describe('sessionBootstrap', () => {
  let fetchMock: jest.Mock
  const netInfo = NetInfo as jest.Mocked<typeof NetInfo>

  beforeEach(async () => {
    __resetRefreshSessionForTests()
    fetchMock = mockFetch()
    netInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as never)
    await clearStoredTokens()
  })

  afterEach(async () => {
    await teardownStore(createTestStore())
  })

  it('restores an online session from the refresh token', async () => {
    const store = createTestStore()
    await seedRefreshToken('stored-refresh')
    fetchMock.mockResolvedValueOnce(graphqlSuccess({
      refreshToken: authPayloadFixture({ accessToken: 'restored-access' }),
    }))

    await bootstrapSession(store.dispatch, store.getState as never, { cancelled: () => false })

    expect(store.getState().auth.sessionStatus).toBe('authenticated')
    expect(store.getState().auth.accessToken).toBe('restored-access')
  })

  it('restores a cached user when startup refresh hits a network error', async () => {
    const store = createTestStore()
    await seedRefreshToken('stored-refresh')
    await saveCachedUser(authPayloadFixture().user)
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'))

    await bootstrapSession(store.dispatch, store.getState as never, { cancelled: () => false })

    expect(store.getState().auth.sessionStatus).toBe('offline-authenticated')
    expect(store.getState().auth.user?.email).toBe('user@example.com')
  })

  it('does not finish restoration when the bootstrap effect was cancelled', async () => {
    const store = createTestStore()
    await seedRefreshToken('stored-refresh')

    await bootstrapSession(store.dispatch, store.getState as never, { cancelled: () => true })

    expect(store.getState().auth.sessionStatus).toBe('initializing')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears invalid sessions during reconnect', async () => {
    const store = createTestStore()
    await seedRefreshToken('stored-refresh')
    store.dispatch(setOfflineSession(authPayloadFixture().user))
    fetchMock.mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    const result = await reconnectOfflineSession(store.dispatch, store.getState as never)

    expect(result).toBe('signed-out')
    expect(store.getState().auth.sessionStatus).toBe('unauthenticated')
  })
})
