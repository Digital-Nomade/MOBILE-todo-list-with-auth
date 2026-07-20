import DashboardScreen from '@/app/(home)/(dashboard)/index'
import { TodoSearchModal } from '@/components/features/Dashboard/TodoSearchModal/TodoSearchModal'
import { TodoViewModel } from '@/types/todo-types'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'

const mockUpdateTodo = jest.fn()
const mockUseTodoSearch = jest.fn()

let mockTodosResult: {
  data: TodoViewModel[]
  isLoading: boolean
  isFetching: boolean
  refetch: jest.Mock
  syncState: {
    isOnline: boolean
    localOnly: boolean
    pendingCount: number
    coordinatorStatus: 'idle'
    lastSyncAt: null
    lastError: null
  }
}

function createTodo(
  index: number,
  overrides: Partial<TodoViewModel> & Pick<TodoViewModel, 'title'>,
): TodoViewModel {
  return {
    id: `local-${index}`,
    localId: `local-${index}`,
    serverId: `server-${index}`,
    description: overrides.description ?? `Description for ${overrides.title}`,
    done: overrides.done ?? false,
    dueTo: null,
    reminderOn: null,
    createdAt: '2026-07-10T09:30:00.000Z',
    updatedAt: '2026-07-10T09:30:00.000Z',
    syncStatus: 'synced',
    ...overrides,
  }
}

jest.mock('@/features/todos/offline/hooks', () => ({
  useOfflineTodos: () => mockTodosResult,
  useOfflineTodoMutations: () => ({
    updateTodo: mockUpdateTodo,
  }),
  useTodoSearch: (term: string) => mockUseTodoSearch(term),
}))

jest.mock('@/components/features/TodoSyncStatusBanner/TodoSyncStatusBanner', () => ({
  TodoSyncStatusBanner: () => null,
}))

jest.mock('@/components/features/Dashboard/TodoItem/TodoItem', () => ({
  TodoItem: ({ todo }: { todo: TodoViewModel }) => {
    const { Text } = require('react-native')
    return <Text testID={`todo-item-${todo.id}`}>{todo.title}</Text>
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    dismissAll: jest.fn(),
  }),
}))

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUpdateTodo.mockReset()
    mockUseTodoSearch.mockReturnValue({
      results: [],
      isSearching: false,
      isLocalSearch: false,
    })
    mockTodosResult = {
      data: [],
      isLoading: false,
      isFetching: false,
      refetch: jest.fn(async () => undefined),
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

  it('shows the dashboard empty state when there are no todos', () => {
    render(<DashboardScreen />)

    expect(screen.getByTestId('dashboard-empty-state')).toBeTruthy()
    expect(screen.getByText('No todos yet')).toBeTruthy()
  })

  it('opens the search modal from the dashboard search button', () => {
    mockTodosResult.data = [createTodo(1, { title: 'Buy groceries' })]

    render(<DashboardScreen />)

    fireEvent.press(screen.getByTestId('dashboard-search-button'))

    expect(screen.getByTestId('todo-search-modal')).toBeTruthy()
    expect(screen.getByTestId('todo-search-input')).toBeTruthy()
  })
})

describe('TodoSearchModal', () => {
  const todos = [
    createTodo(1, { title: 'Buy groceries', description: 'Milk and eggs' }),
    createTodo(2, { title: 'Fix toilet', description: 'Plumber visit', done: true }),
  ]

  beforeEach(() => {
    jest.useFakeTimers()
    mockUseTodoSearch.mockReturnValue({
      results: [],
      isSearching: false,
      isLocalSearch: false,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  function renderModal(visible = true) {
    return render(
      <TodoSearchModal
        visible={visible}
        onClose={jest.fn()}
        onCheck={jest.fn()}
      />,
    )
  }

  it('focuses the search input when opened', () => {
    renderModal()

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(screen.getByTestId('todo-search-input').props.autoFocus).toBe(true)
  })

  it('uses a 700ms debounce before searching', async () => {
    renderModal()

    fireEvent.changeText(screen.getByTestId('todo-search-input'), 'fix')

    expect(mockUseTodoSearch).toHaveBeenLastCalledWith('')

    act(() => {
      jest.advanceTimersByTime(699)
    })

    expect(mockUseTodoSearch).toHaveBeenLastCalledWith('')

    act(() => {
      jest.advanceTimersByTime(1)
    })

    expect(mockUseTodoSearch).toHaveBeenLastCalledWith('fix')
  })

  it('shows matching done and undone todos from search results', async () => {
    mockUseTodoSearch.mockImplementation(term =>
      term === 'fix'
        ? { results: [todos[1]], isSearching: false, isLocalSearch: true }
        : { results: [], isSearching: false, isLocalSearch: true },
    )

    renderModal()

    fireEvent.changeText(screen.getByTestId('todo-search-input'), 'fix')

    act(() => {
      jest.advanceTimersByTime(700)
    })

    await waitFor(() => {
      expect(screen.getByTestId('todo-item-local-2')).toBeTruthy()
    })
  })

  it('shows a loading indicator while backend search is in progress', async () => {
    mockUseTodoSearch.mockReturnValue({
      results: [],
      isSearching: true,
      isLocalSearch: false,
    })

    renderModal()

    fireEvent.changeText(screen.getByTestId('todo-search-input'), 'fix')

    act(() => {
      jest.advanceTimersByTime(700)
    })

    expect(screen.getByTestId('todo-search-loading')).toBeTruthy()
  })

  it('shows a server no-results message for unmatched backend queries', async () => {
    mockUseTodoSearch.mockReturnValue({
      results: [],
      isSearching: false,
      isLocalSearch: false,
    })

    renderModal()

    fireEvent.changeText(screen.getByTestId('todo-search-input'), 'missing')

    act(() => {
      jest.advanceTimersByTime(700)
    })

    await waitFor(() => {
      expect(screen.getByTestId('todo-search-empty')).toBeTruthy()
      expect(screen.getByText('Nothing to search')).toBeTruthy()
      expect(screen.getByText(/No matching todos were found on the server/)).toBeTruthy()
    })
  })

  it('shows a local no-results message when searching in local-only mode', async () => {
    mockUseTodoSearch.mockReturnValue({
      results: [],
      isSearching: false,
      isLocalSearch: true,
    })

    renderModal()

    fireEvent.changeText(screen.getByTestId('todo-search-input'), 'missing')

    act(() => {
      jest.advanceTimersByTime(700)
    })

    await waitFor(() => {
      expect(screen.getByText(/No matching todos were found in your local list/)).toBeTruthy()
    })
  })

  it('clears the query and closes the modal', () => {
    const onClose = jest.fn()
    render(
      <TodoSearchModal
        visible
        onClose={onClose}
        onCheck={jest.fn()}
      />,
    )

    fireEvent.changeText(screen.getByTestId('todo-search-input'), 'buy')
    fireEvent.press(screen.getByTestId('todo-search-clear'))

    expect(screen.getByTestId('todo-search-input').props.value).toBe('')

    fireEvent.press(screen.getByTestId('todo-search-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
