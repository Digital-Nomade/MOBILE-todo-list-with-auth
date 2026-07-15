import CheckEmailScreen from '@/app/(auth)/check-email'
import VerifyEmailScreen from '@/app/(auth)/verify-email'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockDispatch = jest.fn()
const mockVerifyEmail = jest.fn()
const mockResendVerification = jest.fn()
const mockReplace = jest.fn()
let mockSearchParams: { token?: string } = {}
let mockAuthState: {
  signupEmail: string
  user: {
    id: string
    email: string
    username: string
    status: 'PENDING_VERIFICATION'
    emailVerifiedAt: null
  } | null
}

jest.mock('@/config/redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: mockAuthState }),
}))

jest.mock('@/features/auth/authApi', () => ({
  useVerifyEmailMutation: () => [mockVerifyEmail],
  useResendVerificationMutation: () => [
    mockResendVerification,
    { isLoading: false },
  ],
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
}))

const verifiedUser = {
  id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
  email: 'user@example.com',
  username: 'user',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-07-15T00:00:00.000Z',
}

describe('email verification screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = {}
    mockAuthState = {
      signupEmail: 'user@example.com',
      user: null,
    }
  })

  describe('VerifyEmailScreen', () => {
    it('renders the missing-token state without calling the mutation', async () => {
      render(<VerifyEmailScreen />)

      expect(
        await screen.findByText(/This verification link is incomplete/)
      ).toBeTruthy()
      expect(mockVerifyEmail).not.toHaveBeenCalled()

      fireEvent.press(screen.getByText('resend verification email'))
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/check-email')
    })

    it('consumes the query token and renders success', async () => {
      mockSearchParams = { token: 'verification-token' }
      mockVerifyEmail.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(verifiedUser),
      })

      render(<VerifyEmailScreen />)

      expect(mockVerifyEmail).toHaveBeenCalledWith({
        token: 'verification-token',
      })
      expect(
        await screen.findByText(/Your email has been verified/)
      ).toBeTruthy()

      fireEvent.press(screen.getByText('go to login'))
      expect(mockReplace).toHaveBeenCalledWith('/(auth)')
    })

    it('updates the current pending-user snapshot after verification', async () => {
      mockSearchParams = { token: 'verification-token' }
      mockAuthState.user = {
        id: verifiedUser.id,
        email: verifiedUser.email,
        username: verifiedUser.username,
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      }
      mockVerifyEmail.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue(verifiedUser),
      })

      render(<VerifyEmailScreen />)

      await screen.findByText(/Your email has been verified/)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'auth/setUserSnapshot',
        payload: verifiedUser,
      })
    })

    it('shows invalid-token feedback and allows one explicit retry', async () => {
      mockSearchParams = { token: 'expired-token' }
      mockVerifyEmail
        .mockReturnValueOnce({
          unwrap: jest.fn().mockRejectedValue({
            code: 'BAD_USER_INPUT',
            message: 'environment-specific backend wording',
          }),
        })
        .mockReturnValueOnce({
          unwrap: jest.fn().mockResolvedValue(verifiedUser),
        })

      render(<VerifyEmailScreen />)

      expect(
        await screen.findByText('This verification link is invalid or has expired.')
      ).toBeTruthy()
      expect(
        screen.queryByText('environment-specific backend wording')
      ).toBeNull()

      fireEvent.press(screen.getByText('try again'))

      expect(
        await screen.findByText(/Your email has been verified/)
      ).toBeTruthy()
      expect(mockVerifyEmail).toHaveBeenCalledTimes(2)
    })
  })

  describe('CheckEmailScreen', () => {
    it('prefills the known email and displays the generic resend response', async () => {
      mockResendVerification.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({
          message: 'If eligible, a new verification email has been sent.',
        }),
      })

      render(<CheckEmailScreen />)

      expect(screen.getByDisplayValue('user@example.com')).toBeTruthy()
      fireEvent.press(screen.getByText('resend verification email'))

      await waitFor(() => {
        expect(mockResendVerification).toHaveBeenCalledWith({
          email: 'user@example.com',
        })
      })
      expect(
        await screen.findByText(
          'If eligible, a new verification email has been sent.'
        )
      ).toBeTruthy()
    })

    it('requires an email before resending', async () => {
      mockAuthState.signupEmail = ''

      render(<CheckEmailScreen />)
      fireEvent.press(screen.getByText('resend verification email'))

      expect(
        await screen.findByText(
          'Enter your email to resend the verification message.'
        )
      ).toBeTruthy()
      expect(mockResendVerification).not.toHaveBeenCalled()
    })
  })
})
