import ProfileScreen from '@/app/(home)/profile'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockUpdateProfile = jest.fn()
const mockLogout = jest.fn()
const mockLogoutAll = jest.fn()
const mockNavigate = jest.fn()
let mockMeResult: {
  data?: typeof profile
  isLoading: boolean
  error?: unknown
}

const profile = {
  id: '8eb8fb9f-7866-4a1f-bc89-cab91b3fa6d2',
  name: 'Ada',
  lastName: 'Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  birthdate: '1990-12-10T00:00:00.000Z',
  profilePicture: 'https://example.com/profile.png',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
}

jest.mock('@/features/user/userApi', () => ({
  useMeQuery: () => mockMeResult,
  useUpdateProfileMutation: () => [
    mockUpdateProfile,
    { isLoading: false },
  ],
}))

jest.mock('@/features/auth/authApi', () => ({
  useLogoutMutation: () => [mockLogout, { isLoading: false }],
  useLogoutAllMutation: () => [mockLogoutAll, { isLoading: false }],
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}))

jest.mock('@/components/atoms', () => {
  const actual = jest.requireActual('@/components/atoms')
  const { Pressable, Text } = require('react-native')

  return {
    ...actual,
    DatePicker: ({ onChange }: { onChange: (date: Date) => void }) => (
      <Pressable
        testID="profile-birthdate-picker"
        onPress={() => onChange(new Date('1991-01-02T00:00:00.000Z'))}
      >
        <Text>Change birthdate</Text>
      </Pressable>
    ),
  }
})

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMeResult = { data: profile, isLoading: false }
    mockUpdateProfile.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(profile),
    })
    mockLogout.mockResolvedValue({ data: { message: 'Logged out.' } })
    mockLogoutAll.mockResolvedValue({ data: { message: 'Logged out.' } })
  })

  it('renders identity fields as read-only text and editable profile fields', async () => {
    render(<ProfileScreen />)

    expect(screen.getByText('ada · ada@example.com')).toBeTruthy()
    expect(await screen.findByDisplayValue('Ada')).toBeTruthy()
    expect(screen.getByDisplayValue('Lovelace')).toBeTruthy()
    expect(
      screen.getByDisplayValue('https://example.com/profile.png')
    ).toBeTruthy()
    expect(screen.queryByPlaceholderText('email')).toBeNull()
    expect(screen.queryByPlaceholderText('username')).toBeNull()
  })

  it('submits only editable fields, omitting email and username', async () => {
    render(<ProfileScreen />)
    await screen.findByDisplayValue('Ada')

    fireEvent.changeText(screen.getByPlaceholderText('name'), 'Augusta Ada')
    fireEvent.changeText(
      screen.getByPlaceholderText('profile picture URL'),
      'https://example.com/new-profile.png'
    )
    fireEvent.press(screen.getByTestId('profile-birthdate-picker'))
    fireEvent.press(screen.getByText('Save changes'))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Augusta Ada',
        lastName: 'Lovelace',
        birthdate: '1991-01-02T00:00:00.000Z',
        profilePicture: 'https://example.com/new-profile.png',
      })
    })

    const submitted = mockUpdateProfile.mock.calls[0][0]
    expect(submitted).not.toHaveProperty('email')
    expect(submitted).not.toHaveProperty('username')
    expect(await screen.findByText('Profile updated.')).toBeTruthy()
  })

  it('opens the change-password screen', async () => {
    render(<ProfileScreen />)
    await screen.findByDisplayValue('Ada')

    fireEvent.press(screen.getByText('Change password'))
    expect(mockNavigate).toHaveBeenCalledWith('/(home)/change-password')
  })

  it('triggers logout and logout-all from their respective actions', async () => {
    render(<ProfileScreen />)
    await screen.findByDisplayValue('Ada')

    fireEvent.press(screen.getByText('Logout'))
    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1))

    fireEvent.press(screen.getByText('Logout from all devices'))
    await waitFor(() => expect(mockLogoutAll).toHaveBeenCalledTimes(1))
  })

  it('renders a safe error state when the profile cannot be loaded', () => {
    mockMeResult = {
      isLoading: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      },
    }

    render(<ProfileScreen />)

    expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy()
    expect(screen.getByText('Logout')).toBeTruthy()
  })
})
