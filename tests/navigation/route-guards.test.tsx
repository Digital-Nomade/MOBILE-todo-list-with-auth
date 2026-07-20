import AuthLayout from '@/app/(auth)/_layout'
import HomeLayout from '@/app/(home)/_layout'
import { render, screen } from '@testing-library/react-native'

let mockSession: {
  isInitializing: boolean
  isAuthenticated: boolean
  canUseBackend: boolean
  isOfflineAuthenticated: boolean
  user: {
    id: string
    status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
  } | null
}

jest.mock('@/hooks/useSession', () => ({
  useSession: () => mockSession,
}))

jest.mock('expo-router', () => {
  const { Text, View } = require('react-native')

  const Stack = ({ children }: { children: React.ReactNode }) => (
    <View>
      <Text>auth-stack</Text>
      {children}
    </View>
  )
  Stack.Screen = function StackScreen() {
    return null
  }

  const Tabs = ({ children }: { children: React.ReactNode }) => (
    <View>
      <Text>home-tabs</Text>
      {children}
    </View>
  )
  Tabs.Screen = function TabsScreen() {
    return null
  }

  return {
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    Stack,
    Tabs,
  }
})

describe('route guards', () => {
  beforeEach(() => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: false,
      canUseBackend: false,
      isOfflineAuthenticated: false,
      user: null,
    }
  })

  it('renders nothing while the session is initializing', () => {
    mockSession.isInitializing = true

    const auth = render(<AuthLayout />)
    expect(auth.toJSON()).toBeNull()
    auth.unmount()

    const home = render(<HomeLayout />)
    expect(home.toJSON()).toBeNull()
  })

  it('redirects unauthenticated users away from protected routes', () => {
    render(<HomeLayout />)

    expect(screen.getByText('redirect:/(auth)')).toBeTruthy()
  })

  it('redirects active authenticated users away from auth routes', () => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: true,
      canUseBackend: true,
      isOfflineAuthenticated: false,
      user: {
        id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
        status: 'ACTIVE',
      },
    }

    render(<AuthLayout />)

    expect(screen.getByText('redirect:/(home)')).toBeTruthy()
  })

  it('redirects pending authenticated users to email confirmation', () => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: true,
      canUseBackend: true,
      isOfflineAuthenticated: false,
      user: {
        id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
        status: 'PENDING_VERIFICATION',
      },
    }

    render(<AuthLayout />)

    expect(screen.getByText('redirect:/(auth)/check-email')).toBeTruthy()
  })

  it('sends pending users to verification guidance', () => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: true,
      canUseBackend: true,
      isOfflineAuthenticated: false,
      user: {
        id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
        status: 'PENDING_VERIFICATION',
      },
    }

    render(<HomeLayout />)

    expect(screen.getByText('redirect:/(auth)/check-email')).toBeTruthy()
  })

  it('sends suspended users to the account-unavailable state', () => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: true,
      canUseBackend: true,
      isOfflineAuthenticated: false,
      user: {
        id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
        status: 'SUSPENDED',
      },
    }

    render(<HomeLayout />)

    expect(
      screen.getByText('redirect:/(auth)/account-unavailable')
    ).toBeTruthy()
  })

  it('renders protected tabs for offline authenticated users', () => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: true,
      canUseBackend: false,
      isOfflineAuthenticated: true,
      user: {
        id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
        status: 'ACTIVE',
      },
    }

    render(<HomeLayout />)

    expect(screen.getByText('home-tabs')).toBeTruthy()
  })

  it('renders protected tabs for active users', () => {
    mockSession = {
      isInitializing: false,
      isAuthenticated: true,
      canUseBackend: true,
      isOfflineAuthenticated: false,
      user: {
        id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
        status: 'ACTIVE',
      },
    }

    render(<HomeLayout />)

    expect(screen.getByText('home-tabs')).toBeTruthy()
  })
})
