import { filterTodosByQuery } from '@/components/features/Dashboard/TodoSearchModal/filterTodosByQuery'
import { searchServerTodos } from '@/features/todos/offline/todoService'
import { TodoViewModel } from '@/types/todo-types'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlError,
  graphqlSuccess,
  mockFetch,
  parseGraphQLCall,
  seedRefreshToken,
  teardownStore,
} from '@/test-utils'
import { setCredentials } from '@/features/auth/authFlowSlice'
import { renderHook, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import authReducer from '@/features/auth/authFlowSlice'
import offlineTodosReducer, { setHydratedTodos } from '@/features/todos/offline/offlineSlice'
import { api } from '@/config/redux/api'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { useTodoSearch } from '@/features/todos/offline/hooks'

const todoFixture = {
  id: 'server-1',
  title: 'Buy groceries',
  description: 'Milk and eggs',
  done: false,
  dueTo: null,
  reminderOn: null,
  createdAt: '2026-07-10T09:30:00.000Z',
  updatedAt: '2026-07-10T09:30:00.000Z',
}

function createLocalTodo(title: string, index: number): TodoViewModel {
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
    syncStatus: 'local_only',
  }
}

function createSearchStore(localOnly: boolean) {
  const store = configureStore({
    reducer: combineReducers({
      auth: authReducer,
      offlineTodos: offlineTodosReducer,
      [api.reducerPath]: api.reducer,
    }),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false }).concat(api.middleware),
  })

  store.dispatch(setCredentials(authPayloadFixture()))
  store.dispatch(setHydratedTodos({
    records: [{
      localId: 'local-1',
      serverId: 'server-1',
      title: 'Buy groceries',
      description: 'Milk and eggs',
      done: true,
      dueTo: null,
      reminderOn: null,
      createdAt: '2026-07-10T09:30:00.000Z',
      updatedAt: '2026-07-10T09:30:00.000Z',
      syncStatus: localOnly ? 'local_only' : 'synced',
    }],
    localOnly,
    pendingCount: 0,
    lastSyncAt: null,
  }))

  return store
}

describe('searchServerTodos', () => {
  let fetchMock: jest.Mock

  beforeEach(async () => {
    fetchMock = mockFetch()
    await clearStoredTokens()
    await seedRefreshToken('refresh-1')
  })

  it('maps server search results to view models', async () => {
    const store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture()))
    fetchMock.mockResolvedValueOnce(graphqlSuccess({
      searchTodos: { data: [todoFixture], first: 1, last: 1, limit: 50, total: 1 },
    }))

    const results = await searchServerTodos(store.dispatch, 'groceries')

    expect(parseGraphQLCall(fetchMock.mock.calls[0]).variables.term).toBe('groceries')
    expect(results).toHaveLength(1)
    expect(results[0]?.title).toBe('Buy groceries')

    await teardownStore(store)
  })
})

describe('useTodoSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('searches local todos when local-only mode is enabled', async () => {
    const store = createSearchStore(true)

    const { result, unmount } = renderHook(() => useTodoSearch('buy'), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })

    await waitFor(() => {
      expect(result.current.isLocalSearch).toBe(true)
      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0]?.title).toBe('Buy groceries')
    })

    unmount()
    store.dispatch(api.util.resetApiState())
  })

  it('includes done todos in local search results', () => {
    const todos = [
      createLocalTodo('Active task', 1),
      createLocalTodo('Done task', 2),
    ]
    todos[1]!.done = true

    const results = filterTodosByQuery(todos, 'done')
    expect(results).toHaveLength(1)
    expect(results[0]?.done).toBe(true)
  })

  it('falls back to local results when server search loses connectivity', async () => {
    const store = createSearchStore(false)
    mockFetch().mockRejectedValueOnce(new Error('offline'))

    const { result, unmount } = renderHook(() => useTodoSearch('buy'), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })

    await waitFor(() => {
      expect(result.current.isLocalSearch).toBe(true)
      expect(result.current.results).toHaveLength(1)
      expect(result.current.searchError).toBeNull()
    })

    unmount()
    store.dispatch(api.util.resetApiState())
  })

  it('surfaces semantic search failures instead of showing no matches', async () => {
    const store = createSearchStore(false)
    mockFetch().mockResolvedValueOnce(graphqlError('FORBIDDEN'))

    const { result, unmount } = renderHook(() => useTodoSearch('buy'), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })

    await waitFor(() => {
      expect(result.current.results).toEqual([])
      expect(result.current.searchError).toBe(
        'You are not allowed to perform this action.',
      )
    })

    unmount()
    store.dispatch(api.util.resetApiState())
  })
})
