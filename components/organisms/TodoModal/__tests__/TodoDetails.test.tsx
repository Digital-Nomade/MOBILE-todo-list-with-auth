import { TodoDetails } from '@/components/organisms/TodoModal/TodoDetails'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockCreateTodo = jest.fn()
const mockDismiss = jest.fn()

jest.mock('@/features/todos/offline/hooks', () => ({
  useOfflineTodoMutations: () => ({
    createTodo: mockCreateTodo,
    updateTodo: jest.fn(),
  }),
}))

jest.mock('@/components/atoms', () => {
  const actual = jest.requireActual('@/components/atoms')
  const { Pressable } = require('react-native')

  return {
    ...actual,
    DatePicker: ({ onChange }: { onChange: (date: Date) => void }) => (
      <Pressable
        testID="todo-date-picker"
        onPress={() => onChange(new Date('2026-07-21T09:00:00.000Z'))}
      />
    ),
  }
})

jest.mock('expo-router', () => ({
  useRouter: () => ({
    dismiss: mockDismiss,
  }),
}))

describe('TodoDetails onClose', () => {
  beforeEach(() => {
    mockCreateTodo.mockReset()
    mockDismiss.mockReset()
    mockCreateTodo.mockResolvedValue(undefined)
  })

  it('uses onClose instead of router.dismiss after save and cancel', async () => {
    const onClose = jest.fn()

    render(<TodoDetails onClose={onClose} />)

    fireEvent.changeText(screen.getByTestId('todo-title-input'), 'Buy milk')

    await waitFor(() => {
      expect(screen.getByTestId('todo-save-button').props.disabled).not.toBe(true)
    })

    fireEvent.press(screen.getByTestId('todo-save-button'))

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Buy milk' }),
      )
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(mockDismiss).not.toHaveBeenCalled()
    })

    fireEvent.press(screen.getByTestId('todo-cancel-button'))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(mockDismiss).not.toHaveBeenCalled()
  })

  it('falls back to router.dismiss when onClose is not provided', async () => {
    render(<TodoDetails />)

    fireEvent.press(screen.getByTestId('todo-cancel-button'))

    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })
})
