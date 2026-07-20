import { TodoNavigator } from '@/components/features/Home/TodoNavigator/TodoNavigator'
import { TodoViewModel } from '@/types/todo-types'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockUpdateTodo = jest.fn()

let mockTodosResult: {
  data: TodoViewModel[]
  isLoading: boolean
  isFetching: boolean
  syncState: {
    isOnline: boolean
    localOnly: boolean
    pendingCount: number
    coordinatorStatus: 'idle'
    lastSyncAt: null
    lastError: null
  }
}

function createTodo(title: string, index: number): TodoViewModel {
  return {
    id: `local-${index}`,
    localId: `local-${index}`,
    serverId: `server-${index}`,
    title,
    description: `Description for ${title}`,
    done: false,
    dueTo: null,
    reminderOn: null,
    createdAt: '2026-07-10T09:30:00.000Z',
    updatedAt: '2026-07-10T09:30:00.000Z',
    syncStatus: 'synced',
  }
}

jest.mock('@/features/todos/offline/hooks', () => ({
  useOfflineTodos: () => mockTodosResult,
  useOfflineTodoMutations: () => ({
    updateTodo: mockUpdateTodo,
  }),
}))

jest.mock('@/components/features/TodoSyncStatusBanner/TodoSyncStatusBanner', () => ({
  TodoSyncStatusBanner: () => null,
}))

jest.mock('moti', () => {
  const { View } = require('react-native')

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    MotiView: View,
  }
})

describe('TodoNavigator', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUpdateTodo.mockReset()
    mockTodosResult = {
      data: [],
      isLoading: false,
      isFetching: false,
      syncState: {
        isOnline: true,
        localOnly: false,
        pendingCount: 0,
        coordinatorStatus: 'idle',
        lastSyncAt: null,
        lastError: null,
      },
    }
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  function pressNavigationButton(testId: 'todo-navigator-previous' | 'todo-navigator-next') {
    act(() => {
      fireEvent.press(screen.getByTestId(testId))
      jest.advanceTimersByTime(200)
    })
  }

  it('shows an empty state when there are no todos', () => {
    render(<TodoNavigator />)

    expect(screen.getByTestId('todo-navigator-empty')).toBeTruthy()
    expect(screen.getByText('No todos yet')).toBeTruthy()
    expect(screen.queryByTestId('todo-navigator-title')).toBeNull()
  })

  it('disables both navigation buttons when there are no todos', () => {
    render(<TodoNavigator />)

    expect(screen.getByTestId('todo-navigator-previous').props.accessibilityState?.disabled).toBe(true)
    expect(screen.getByTestId('todo-navigator-next').props.accessibilityState?.disabled).toBe(true)
  })

  it('disables both navigation buttons when there is only one todo', () => {
    mockTodosResult.data = [createTodo('Only todo', 1)]

    render(<TodoNavigator />)

    expect(screen.getByText('Only todo')).toBeTruthy()
    expect(screen.getByTestId('todo-navigator-previous').props.accessibilityState?.disabled).toBe(true)
    expect(screen.getByTestId('todo-navigator-next').props.accessibilityState?.disabled).toBe(true)
  })

  it('disables the previous button on the first todo', () => {
    mockTodosResult.data = [
      createTodo('First todo', 1),
      createTodo('Second todo', 2),
    ]

    render(<TodoNavigator />)

    expect(screen.getByText('First todo')).toBeTruthy()
    expect(screen.getByTestId('todo-navigator-previous').props.accessibilityState?.disabled).toBe(true)
    expect(screen.getByTestId('todo-navigator-next').props.accessibilityState?.disabled).toBe(false)
  })

  it('disables the next button on the last todo', async () => {
    mockTodosResult.data = [
      createTodo('First todo', 1),
      createTodo('Second todo', 2),
      createTodo('Third todo', 3),
    ]

    render(<TodoNavigator />)

    pressNavigationButton('todo-navigator-next')
    pressNavigationButton('todo-navigator-next')

    await waitFor(() => {
      expect(screen.getByText('Third todo')).toBeTruthy()
    })

    expect(screen.getByTestId('todo-navigator-previous').props.accessibilityState?.disabled).toBe(false)
    expect(screen.getByTestId('todo-navigator-next').props.accessibilityState?.disabled).toBe(true)
  })

  it('navigates forward and backward between multiple todos', async () => {
    mockTodosResult.data = [
      createTodo('First todo', 1),
      createTodo('Second todo', 2),
    ]

    render(<TodoNavigator />)

    pressNavigationButton('todo-navigator-next')

    await waitFor(() => {
      expect(screen.getByText('Second todo')).toBeTruthy()
    })

    pressNavigationButton('todo-navigator-previous')

    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeTruthy()
    })
  })

  it('clamps the active todo when the list shrinks', async () => {
    mockTodosResult.data = [
      createTodo('First todo', 1),
      createTodo('Second todo', 2),
    ]

    const view = render(<TodoNavigator />)

    pressNavigationButton('todo-navigator-next')

    await waitFor(() => {
      expect(screen.getByText('Second todo')).toBeTruthy()
    })

    mockTodosResult.data = [createTodo('First todo', 1)]
    view.rerender(<TodoNavigator />)

    await waitFor(() => {
      expect(screen.getByText('First todo')).toBeTruthy()
    })
  })
})
