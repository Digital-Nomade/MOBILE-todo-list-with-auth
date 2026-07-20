import ForgotPasswordScreen from '@/app/(auth)/forgot-password'
import ResetPasswordScreen from '@/app/(auth)/reset-password'
import { ChangePasswordModal } from '@/components/features/ChangePasswordModal/ChangePasswordModal'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockRequestPasswordReset = jest.fn()
const mockResetPassword = jest.fn()
const mockChangePassword = jest.fn()
const mockReplace = jest.fn()
let mockSearchParams: { token?: string } = {}

jest.mock('@/features/auth/authApi', () => ({
  useRequestPasswordResetMutation: () => [
    mockRequestPasswordReset,
    { isLoading: false },
  ],
  useResetPasswordMutation: () => [mockResetPassword, { isLoading: false }],
}))

jest.mock('@/features/user/userApi', () => ({
  useChangePasswordMutation: () => [
    mockChangePassword,
    { isLoading: false },
  ],
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
}))

describe('password lifecycle screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = {}
  })

  describe('ForgotPasswordScreen', () => {
    it('submits the email and displays the generic server message', async () => {
      mockRequestPasswordReset.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({
          message: 'If the account exists, a reset link has been sent.',
        }),
      })

      render(<ForgotPasswordScreen />)

      fireEvent.changeText(screen.getByPlaceholderText('email'), 'user@example.com')
      fireEvent.press(screen.getByText('send reset link'))

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: 'user@example.com',
        })
      })

      expect(
        await screen.findByText('If the account exists, a reset link has been sent.')
      ).toBeTruthy()
      expect(screen.getByText('send it again')).toBeTruthy()
    })

    it('validates malformed emails without calling the API', async () => {
      render(<ForgotPasswordScreen />)

      fireEvent.changeText(screen.getByPlaceholderText('email'), 'not-an-email')
      fireEvent.press(screen.getByText('send reset link'))

      expect(await screen.findByText('You must provide a valid email')).toBeTruthy()
      expect(mockRequestPasswordReset).not.toHaveBeenCalled()
    })
  })

  describe('ResetPasswordScreen', () => {
    it('shows the incomplete-link state when no token is present', () => {
      render(<ResetPasswordScreen />)

      expect(
        screen.getByText(/This reset link is incomplete/)
      ).toBeTruthy()

      fireEvent.press(screen.getByText('request a new link'))
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/forgot-password')
    })

    it('submits token and newPassword, then redirects to login', async () => {
      mockSearchParams = { token: 'reset-token' }
      mockResetPassword.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ message: 'Password updated.' }),
      })

      render(<ResetPasswordScreen />)

      fireEvent.changeText(screen.getByPlaceholderText('new password'), 'new-password')
      fireEvent.changeText(
        screen.getByPlaceholderText('retype new password'),
        'new-password'
      )
      fireEvent.press(screen.getByText('reset password'))

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'reset-token',
          newPassword: 'new-password',
        })
      })
      expect(mockReplace).toHaveBeenCalledWith('/(auth)')
    })

    it('prevents mismatched passwords from being submitted', async () => {
      mockSearchParams = { token: 'reset-token' }
      render(<ResetPasswordScreen />)

      fireEvent.changeText(screen.getByPlaceholderText('new password'), 'new-password')
      fireEvent.changeText(
        screen.getByPlaceholderText('retype new password'),
        'different-password'
      )
      fireEvent.press(screen.getByText('reset password'))

      expect(await screen.findByText('Your passwords doesn`t match')).toBeTruthy()
      expect(mockResetPassword).not.toHaveBeenCalled()
    })
  })

  describe('ChangePasswordModal', () => {
    it('sends current and new passwords', async () => {
      mockChangePassword.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({
          id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
          updatedAt: '2026-07-15T00:00:00.000Z',
        }),
      })

      render(<ChangePasswordModal visible onClose={jest.fn()} />)

      fireEvent.changeText(
        screen.getByPlaceholderText('current password'),
        'old-password'
      )
      fireEvent.changeText(screen.getByPlaceholderText('new password'), 'new-password')
      fireEvent.changeText(
        screen.getByPlaceholderText('retype new password'),
        'new-password'
      )
      fireEvent.press(screen.getByText('change password'))

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: 'old-password',
          newPassword: 'new-password',
        })
      })
    })

    it('maps an unauthenticated error to current-password feedback', async () => {
      mockChangePassword.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({
          code: 'UNAUTHENTICATED',
          message: 'raw server wording',
        }),
      })

      render(<ChangePasswordModal visible onClose={jest.fn()} />)

      fireEvent.changeText(
        screen.getByPlaceholderText('current password'),
        'wrong-password'
      )
      fireEvent.changeText(screen.getByPlaceholderText('new password'), 'new-password')
      fireEvent.changeText(
        screen.getByPlaceholderText('retype new password'),
        'new-password'
      )
      fireEvent.press(screen.getByText('change password'))

      expect(
        await screen.findByText('Your current password is incorrect.')
      ).toBeTruthy()
      expect(screen.queryByText('raw server wording')).toBeNull()
    })
  })
})
