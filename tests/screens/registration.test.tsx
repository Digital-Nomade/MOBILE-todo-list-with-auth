import SignUpProfileScreen from '@/app/(auth)/signup-profile'
import {
  clearStoredVerificationFlow,
  loadVerificationFlow,
} from '@/features/auth/verificationFlowStorage'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockCreateUser = jest.fn()
const mockDispatch = jest.fn()
const mockNavigate = jest.fn()
const mockReplace = jest.fn()

jest.mock('@/config/redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => ({
    signupEmail: ' Ada@Example.COM ',
    signupPassword: 'secret-password',
  }),
}))

jest.mock('@/features/auth/authApi', () => ({
  useCreateUserMutation: () => [mockCreateUser, { isLoading: false }],
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
  }),
}))

jest.mock('@/components/atoms', () => {
  const actual = jest.requireActual('@/components/atoms')
  const { Pressable, Text } = require('react-native')

  return {
    ...actual,
    DatePicker: ({ onChange }: { onChange: (date: Date) => void }) => (
      <Pressable
        testID="birthdate-picker"
        onPress={() => onChange(new Date('1990-12-10T00:00:00.000Z'))}
      >
        <Text>Select birthdate</Text>
      </Pressable>
    ),
  }
})

describe('SignUpProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearStoredVerificationFlow()
    mockCreateUser.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        message: 'Check your email.',
      }),
    })
  })

  function fillRequiredFields() {
    fireEvent.changeText(screen.getByPlaceholderText('name'), 'Ada')
    fireEvent.changeText(screen.getByPlaceholderText('last name'), 'Lovelace')
    fireEvent.changeText(screen.getByPlaceholderText('username'), 'ada')
  }

  it('requires a birthdate before registration', async () => {
    render(<SignUpProfileScreen />)
    fillRequiredFields()

    fireEvent.press(screen.getByText('create account'))

    expect(await screen.findByText('You must provide your birthdate')).toBeTruthy()
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('submits the full registration input and navigates to check-email', async () => {
    render(<SignUpProfileScreen />)
    fillRequiredFields()
    fireEvent.press(screen.getByTestId('birthdate-picker'))

    fireEvent.press(screen.getByText('create account'))

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        birthdate: '1990-12-10T00:00:00.000Z',
        email: 'ada@example.com',
        password: 'secret-password',
      })
    })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/check-email')
    })

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/setVerificationFlow',
      payload: {
        email: 'ada@example.com',
        message: 'Check your email.',
        resendAvailableAt: null,
      },
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth/resetAuthState' })
    )
    expect(loadVerificationFlow()).toEqual({
      email: 'ada@example.com',
      message: 'Check your email.',
      resendAvailableAt: null,
    })
    expect(loadVerificationFlow()).not.toHaveProperty('code')
  })

  it('shows a generic error and does not navigate on failure', async () => {
    mockCreateUser.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      }),
    })

    render(<SignUpProfileScreen />)
    fillRequiredFields()
    fireEvent.press(screen.getByTestId('birthdate-picker'))
    fireEvent.press(screen.getByText('create account'))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalledWith('/(auth)/check-email')
  })
})
