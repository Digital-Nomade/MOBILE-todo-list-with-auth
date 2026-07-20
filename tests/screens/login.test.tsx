import LoginScreen from '@/app/(auth)'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockDispatch = jest.fn()
const mockLogin = jest.fn()
const mockNavigate = jest.fn()
const mockReplace = jest.fn()

jest.mock('@/config/redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/features/auth/authApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }],
}))

jest.mock('expo-router', () => {
  const { Text } = require('react-native')

  return {
    Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    useRouter: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
    }),
  }
})

const activePayload = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 900,
  user: {
    id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
    email: 'user@example.com',
    username: 'user',
    status: 'ACTIVE',
    emailVerifiedAt: '2026-01-01T00:00:00.000Z',
  },
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogin.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(activePayload) })
  })

  it('renders the login form', () => {
    render(<LoginScreen />)

    expect(screen.getByText('Login')).toBeTruthy()
    expect(screen.getByPlaceholderText('email or username')).toBeTruthy()
    expect(screen.getByPlaceholderText('password')).toBeTruthy()
    expect(screen.getByText('Forgot password?')).toBeTruthy()
  })

  it('submits identifier and password', async () => {
    render(<LoginScreen />)

    fireEvent.changeText(screen.getByPlaceholderText('email or username'), 'user@example.com')
    fireEvent.changeText(screen.getByPlaceholderText('password'), 'secret-password')
    fireEvent.press(screen.getByText('login'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'user@example.com',
        password: 'secret-password',
      })
    })
  })

  it('routes pending users to verification guidance', async () => {
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        ...activePayload,
        user: { ...activePayload.user, status: 'PENDING_VERIFICATION' },
      }),
    })

    render(<LoginScreen />)

    fireEvent.changeText(screen.getByPlaceholderText('email or username'), 'pending-user@example.com')
    fireEvent.changeText(screen.getByPlaceholderText('password'), 'secret-password')
    fireEvent.press(screen.getByText('login'))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/check-email')
    })
  })

  it('routes forbidden email logins to email confirmation', async () => {
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ code: 'FORBIDDEN', message: 'Forbidden' }),
    })

    render(<LoginScreen />)

    fireEvent.changeText(screen.getByPlaceholderText('email or username'), 'pending-user@example.com')
    fireEvent.changeText(screen.getByPlaceholderText('password'), 'secret-password')
    fireEvent.press(screen.getByText('login'))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/check-email')
    })

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/persistLoginDataForSignUp',
      payload: {
        email: 'pending-user@example.com',
        password: 'secret-password',
      },
    })
    expect(screen.queryByText('This account is not available. Verify your email or contact support.')).toBeNull()
  })

  it('shows forbidden feedback when the identifier is not an email', async () => {
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ code: 'FORBIDDEN', message: 'Forbidden' }),
    })

    render(<LoginScreen />)

    fireEvent.changeText(screen.getByPlaceholderText('email or username'), 'pending-user')
    fireEvent.changeText(screen.getByPlaceholderText('password'), 'secret-password')
    fireEvent.press(screen.getByText('login'))

    expect(
      await screen.findByText('This account is not available. Verify your email or contact support.')
    ).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('shows a safe invalid-credentials message', async () => {
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        code: 'UNAUTHENTICATED',
        message: 'raw backend wording',
      }),
    })

    render(<LoginScreen />)

    fireEvent.changeText(screen.getByPlaceholderText('email or username'), 'user@example.com')
    fireEvent.changeText(screen.getByPlaceholderText('password'), 'wrong-password')
    fireEvent.press(screen.getByText('login'))

    expect(await screen.findByText('Invalid credentials. Please try again.')).toBeTruthy()
    expect(screen.queryByText('raw backend wording')).toBeNull()
  })

  it('validates required fields before calling the mutation', async () => {
    render(<LoginScreen />)

    fireEvent.press(screen.getByText('login'))

    expect(await screen.findByText('You must provide your email or username')).toBeTruthy()
    expect(await screen.findByText('You must provide a password')).toBeTruthy()
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
