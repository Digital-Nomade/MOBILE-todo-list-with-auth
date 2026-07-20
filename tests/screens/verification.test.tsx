import CheckEmailScreen from '@/app/(auth)/check-email'
import {
  clearStoredVerificationFlow,
  loadVerificationFlow,
  saveVerificationFlow,
  type VerificationFlowSnapshot,
} from '@/features/auth/verificationFlowStorage'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockDispatch = jest.fn()
const mockVerifyEmail = jest.fn()
const mockResendVerification = jest.fn()
const mockLogin = jest.fn()
const mockReplace = jest.fn()
let mockVerifyLoading = false
let mockAuthState: {
  user: {
    email: string
    status: 'ACTIVE' | 'PENDING_VERIFICATION'
  } | null
  signupEmail: string
  signupPassword: string
  verificationEmail: string
  verificationMessage: string
  verificationResendAvailableAt: number | null
}
let mockSession = {
  isAuthenticated: false,
}

jest.mock('@/config/redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: mockAuthState }),
}))

jest.mock('@/hooks/useSession', () => ({
  useSession: () => mockSession,
}))

jest.mock('@/features/auth/authApi', () => ({
  useVerifyEmailMutation: () => [mockVerifyEmail, { isLoading: mockVerifyLoading }],
  useResendVerificationMutation: () => [
    mockResendVerification,
    { isLoading: false },
  ],
  useLoginMutation: () => [mockLogin],
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

const verifiedUser = {
  id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
  email: 'user@example.com',
  username: 'user',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-07-15T00:00:00.000Z',
}

describe('confirmation-code screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearStoredVerificationFlow()
    mockVerifyLoading = false
    mockSession = { isAuthenticated: false }
    mockAuthState = {
      user: null,
      signupEmail: '',
      signupPassword: '',
      verificationEmail: 'user@example.com',
      verificationMessage: 'Enter the code sent to your email.',
      verificationResendAvailableAt: null,
    }
    mockVerifyEmail.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(verifiedUser),
    })
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        user: verifiedUser,
      }),
    })
    mockResendVerification.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        message: 'If eligible, a new confirmation code has been sent.',
      }),
    })
  })

  it('automatically sends a code when opened from login redirect', async () => {
    saveVerificationFlow({
      email: 'user@example.com',
      message: 'Confirm your email to sign in.',
      resendAvailableAt: null,
      requestCodeOnEntry: true,
    })
    mockAuthState.verificationEmail = ''
    mockAuthState.verificationMessage = ''

    render(<CheckEmailScreen />)

    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledWith({
        email: 'user@example.com',
      })
    })
    expect(
      await screen.findByText('If eligible, a new confirmation code has been sent.')
    ).toBeTruthy()
  })

  it('automatically sends a code for authenticated pending users', async () => {
    mockSession = { isAuthenticated: true }
    mockAuthState.user = {
      email: 'user@example.com',
      status: 'PENDING_VERIFICATION',
    }

    render(<CheckEmailScreen />)

    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledWith({
        email: 'user@example.com',
      })
    })
  })

  it('does not automatically send a code after signup registration', async () => {
    render(<CheckEmailScreen />)

    await waitFor(() => {
      expect(mockResendVerification).not.toHaveBeenCalled()
    })
  })

  it('routes authenticated pending users to home after verification', async () => {
    mockSession = { isAuthenticated: true }
    mockAuthState.user = {
      email: 'user@example.com',
      status: 'PENDING_VERIFICATION',
    }

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '001234')
    fireEvent.press(screen.getByText('confirm code'))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(home)')
    })
    expect(screen.queryByText(/Your email has been confirmed/)).toBeNull()
  })

  it('auto-logs in after signup verification when credentials are available', async () => {
    mockAuthState.signupEmail = 'user@example.com'
    mockAuthState.signupPassword = 'secret-password'

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '001234')
    fireEvent.press(screen.getByText('confirm code'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'user@example.com',
        password: 'secret-password',
      })
      expect(mockReplace).toHaveBeenCalledWith('/(home)')
    })
  })

  it('accepts six digits, preserves leading zeroes, and submits email with code', async () => {
    render(<CheckEmailScreen />)

    expect(screen.getByText('Enter the code sent to your email.')).toBeTruthy()
    const codeInput = screen.getByLabelText('Six-digit confirmation code')
    fireEvent.changeText(codeInput, '00a1234567')

    expect(screen.getByDisplayValue('001234')).toBeTruthy()
    fireEvent.press(screen.getByText('confirm code'))

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '001234',
      })
    })
    expect(await screen.findByText(/Your email has been confirmed/)).toBeTruthy()

    fireEvent.press(screen.getByText('go to login'))
    expect(mockReplace).toHaveBeenCalledWith('/(auth)')
  })

  it('shows manual login success when no session or credentials are available', async () => {
    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '001234')
    fireEvent.press(screen.getByText('confirm code'))

    expect(await screen.findByText(/Your email has been confirmed/)).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalledWith('/(home)')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('validates that the code contains exactly six digits', async () => {
    render(<CheckEmailScreen />)

    fireEvent.changeText(screen.getByTestId('verification-code-input'), '12345')
    fireEvent.press(screen.getByText('confirm code'))

    expect(await screen.findByText('Enter the six-digit confirmation code.')).toBeTruthy()
    expect(mockVerifyEmail).not.toHaveBeenCalled()
  })

  it('shows a safe invalid-or-expired error from UNAUTHENTICATED', async () => {
    mockVerifyEmail.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        code: 'UNAUTHENTICATED',
        message: 'environment-specific backend wording',
      }),
    })

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '123456')
    fireEvent.press(screen.getByText('confirm code'))

    expect(await screen.findByText('Invalid or expired code')).toBeTruthy()
    expect(screen.queryByText('environment-specific backend wording')).toBeNull()
  })

  it('temporarily disables verification after a rate-limit response', async () => {
    mockVerifyEmail.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many attempts.',
      }),
    })

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '123456')
    fireEvent.press(screen.getByText('confirm code'))

    expect(await screen.findByText(/Too many attempts/)).toBeTruthy()
    expect(screen.getByText(/try again in \d+s/)).toBeTruthy()
  })

  it('disables duplicate submissions while verification is loading', () => {
    mockVerifyLoading = true

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '123456')
    fireEvent.press(screen.getByTestId('verification-submit-button'))

    expect(mockVerifyEmail).not.toHaveBeenCalled()
    expect(
      screen.getByTestId('verification-submit-button').props.accessibilityState
    ).toEqual({ disabled: true })
  })

  it.each([
    ['BAD_USER_INPUT', 'Check the email and enter a valid six-digit code.'],
    ['UNKNOWN', 'Something went wrong. Please try again.'],
  ])('maps %s failures to safe feedback', async (code, expectedMessage) => {
    mockVerifyEmail.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ code, message: 'backend wording' }),
    })

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '123456')
    fireEvent.press(screen.getByText('confirm code'))

    expect(await screen.findByText(expectedMessage)).toBeTruthy()
    expect(screen.queryByText('backend wording')).toBeNull()
  })

  it('resends with the email, clears the code, and retains the cooldown', async () => {
    const view = render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '012345')
    fireEvent.press(screen.getByText('resend code'))

    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledWith({
        email: 'user@example.com',
      })
    })
    expect(screen.getByTestId('verification-code-input').props.value).toBe('')
    expect(
      await screen.findByText('If eligible, a new confirmation code has been sent.')
    ).toBeTruthy()
    expect(
      screen.getByText('A new code was sent. Your previous code no longer works.')
    ).toBeTruthy()
    expect(screen.getByText(/resend in \d+s/)).toBeTruthy()

    const savedSnapshot = loadVerificationFlow()
    expect(savedSnapshot).toEqual({
      email: 'user@example.com',
      message: 'If eligible, a new confirmation code has been sent.',
      resendAvailableAt: expect.any(Number),
      requestCodeOnEntry: false,
    })
    expect(savedSnapshot).not.toHaveProperty('code')

    view.unmount()
    saveVerificationFlow(savedSnapshot as VerificationFlowSnapshot)
    mockAuthState.verificationEmail = ''
    mockAuthState.verificationMessage = ''
    render(<CheckEmailScreen />)

    expect(screen.getByText(/resend in \d+s/)).toBeTruthy()
  })

  it('provides email entry and a signup recovery path on direct navigation', async () => {
    mockAuthState.verificationEmail = ''
    mockAuthState.verificationMessage = ''

    render(<CheckEmailScreen />)

    expect(screen.getByText(/Enter your registration email/)).toBeTruthy()
    fireEvent.changeText(screen.getByLabelText('Registration email'), ' User@Example.COM ')
    fireEvent.changeText(screen.getByLabelText('Six-digit confirmation code'), '654321')
    fireEvent.press(screen.getByText('confirm code'))

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '654321',
      })
    })
  })

  it('never stores or logs the confirmation code', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)

    render(<CheckEmailScreen />)
    fireEvent.changeText(screen.getByTestId('verification-code-input'), '012345')
    expect(loadVerificationFlow()).toBeNull()
    fireEvent.press(screen.getByText('confirm code'))

    await screen.findByText(/Your email has been confirmed/)
    expect(loadVerificationFlow()).toBeNull()
    expect(mockDispatch.mock.calls.flat()).not.toContainEqual(
      expect.objectContaining({ payload: expect.objectContaining({ code: expect.anything() }) })
    )
    expect(consoleLog).not.toHaveBeenCalled()

    consoleLog.mockRestore()
  })
})
