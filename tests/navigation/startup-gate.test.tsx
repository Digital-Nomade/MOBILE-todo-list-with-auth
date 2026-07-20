import Index from '@/app/index'
import { SplashController, StartupGate } from '@/features/startup/StartupShell'
import { __resetRefreshSessionForTests } from '@/features/auth/refreshSession'
import { SessionProvider } from '@/hooks/useSession'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlSuccess,
  mockFetch,
  seedRefreshToken,
} from '@/test-utils'
import { Provider } from 'react-redux'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { SplashScreen } from 'expo-router'
import { Text, View } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

jest.mock('expo-router', () => {
  const { Text } = require('react-native')

  return {
    Slot: () => null,
    Redirect: ({ href }: { href: string }) => <Text testID={`redirect-${href}`}>{href}</Text>,
    SplashScreen: {
      preventAutoHideAsync: jest.fn(async () => undefined),
      hideAsync: jest.fn(async () => undefined),
    },
  }
})

jest.mock('@/features/todos/offline/TodoSyncProvider', () => ({
  TodoSyncProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function StartupTree() {
  return (
    <StartupGate>
      <SplashController>
        <Index />
      </SplashController>
    </StartupGate>
  )
}

describe('startup gate and splash timing', () => {
  let fetchMock: jest.Mock
  const netInfo = NetInfo as jest.Mocked<typeof NetInfo>
  const splash = SplashScreen as jest.Mocked<typeof SplashScreen>

  beforeEach(async () => {
    __resetRefreshSessionForTests()
    fetchMock = mockFetch()
    netInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as never)
    await clearStoredTokens()
    splash.hideAsync.mockClear()
    splash.preventAutoHideAsync.mockClear()
  })

  it('does not render login while a stored session is restoring', async () => {
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
          <StartupTree />
        </SessionProvider>
      </Provider>,
    )

    expect(view.queryByTestId('redirect-/(auth)')).toBeNull()
    expect(view.queryByTestId('redirect-/(home)')).toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    resolveFetch!(
      graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'restored-access' }),
      }),
    )

    await waitFor(() => {
      expect(view.getByTestId('redirect-/(home)')).toBeTruthy()
    })

    expect(view.queryByTestId('redirect-/(auth)')).toBeNull()
  })

  it('hides the splash only after the destination layout is ready', async () => {
    const store = createTestStore()
    await seedRefreshToken('stored-refresh')
    fetchMock.mockResolvedValueOnce(
      graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'restored-access' }),
      }),
    )

    const view = render(
      <Provider store={store}>
        <SessionProvider>
          <StartupGate>
            <SplashController>
              <View testID="destination-layout">
                <Text>Home</Text>
              </View>
            </SplashController>
          </StartupGate>
        </SessionProvider>
      </Provider>,
    )

    await waitFor(() => {
      expect(view.getByTestId('destination-layout')).toBeTruthy()
    })

    expect(splash.hideAsync).not.toHaveBeenCalled()

    fireEvent(view.getByTestId('splash-layout-root'), 'layout')

    await waitFor(() => {
      expect(splash.hideAsync).toHaveBeenCalledTimes(1)
    })
  })
})
