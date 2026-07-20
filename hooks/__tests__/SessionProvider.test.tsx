import { SessionProvider, useSession } from '@/hooks/useSession'
import { __resetRefreshSessionForTests } from '@/features/auth/refreshSession'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlSuccess,
  mockFetch,
  seedRefreshToken,
} from '@/test-utils'
import { Provider } from 'react-redux'
import { render, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

function Probe() {
  const session = useSession()
  return (
    <Text testID="session-status">
      {session.isInitializing
        ? 'initializing'
        : session.isOfflineAuthenticated
          ? 'offline'
          : session.isAuthenticated
            ? 'authenticated'
            : 'guest'}
    </Text>
  )
}

describe('SessionProvider', () => {
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

  it('keeps the session initializing until refresh completes', async () => {
    const store = createTestStore()
    await seedRefreshToken('stored-refresh')

    let resolveFetch: (value: Response) => void
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>(resolve => {
          resolveFetch = resolve
        }),
    )

    const view = render(
      <Provider store={store}>
        <SessionProvider>
          <Probe />
        </SessionProvider>
      </Provider>,
    )

    expect(view.getByText('initializing')).toBeTruthy()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    resolveFetch!(
      graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'restored-access' }),
      }),
    )

    await waitFor(() => {
      expect(view.getByText('authenticated')).toBeTruthy()
    })
  })
})
