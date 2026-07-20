import { setCredentials } from '@/features/auth/authFlowSlice'
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlSuccess,
  graphqlError,
  mockFetch,
  parseGraphQLCall,
  seedRefreshToken,
  teardownStore,
  TestStore,
} from '@/test-utils'
import {
  createTodoOfflineAware,
  disableLocalOnlyMode,
  enableLocalOnlyMode,
  refreshTodosFromServer,
  resumeLocalOnlyMigration,
  updateTodoOfflineAware,
} from '../todoService'
import { loadOfflineStore } from '../repository'

const USER_ID = 'b3b8f9a0-1c2d-4e5f-8a9b-0c1d2e3f4a5b'

function mockEmptyLocalOnlyMigration(fetchMock: jest.Mock): void {
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
    const { query } = parseGraphQLCall([_url, init])

    if (query.includes('PrepareLocalOnly')) {
      return graphqlSuccess({
        prepareTodoLocalOnlyMigration: {
          migrationId: 'migration-1',
          expiresAt: '2026-07-20T21:00:00.000Z',
          todoCount: 0,
          checksum: 'verified-checksum',
          todos: [],
        },
      })
    }

    if (query.includes('CommitLocalOnly')) {
      return graphqlSuccess({
        commitTodoLocalOnlyMigration: {
          migrationId: 'migration-1',
          deletedCount: 0,
          committedAt: '2026-07-20T20:45:00.000Z',
        },
      })
    }

    return graphqlSuccess({ createTodo: {} })
  })
}

describe('todoService offline routing', () => {
  let fetchMock: jest.Mock
  let store: TestStore

  beforeEach(async () => {
    await AsyncStorage.clear()
    fetchMock = mockFetch()
    store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'access-1', refreshToken: 'refresh-1' })))
    await seedRefreshToken('refresh-1')
    ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true })
  })

  afterEach(async () => {
    await teardownStore(store)
    await clearStoredTokens()
  })

  it('queues create operations when offline and returns immediately', async () => {
    ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false, isInternetReachable: false })

    const created = await createTodoOfflineAware(store.dispatch, USER_ID, {
      title: 'Offline create',
      description: 'saved locally',
    })

    expect(created.title).toBe('Offline create')
    expect(fetchMock).not.toHaveBeenCalled()

    const persisted = await loadOfflineStore(USER_ID)
    expect(persisted.queue).toHaveLength(1)
    expect(persisted.queue[0].type).toBe('CREATE')
    expect(persisted.todos[0].syncStatus).toBe('pending')
  })

  it('creates on the server when online and mirrors locally', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({
      createTodo: {
        id: 'server-1',
        title: 'Online create',
        description: '',
        done: false,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    }))

    const created = await createTodoOfflineAware(store.dispatch, USER_ID, {
      title: 'Online create',
      description: '',
    })

    expect(created.serverId).toBe('server-1')
    expect(parseGraphQLCall(fetchMock.mock.calls[0]).query).toContain('mutation CreateTodo')
  })

  it('stores todos locally without GraphQL when local-only mode is enabled', async () => {
    mockEmptyLocalOnlyMigration(fetchMock)

    await enableLocalOnlyMode(store.dispatch, USER_ID)

    const created = await createTodoOfflineAware(store.dispatch, USER_ID, {
      title: 'Local only',
      description: '',
    })

    expect(created.syncStatus).toBe('local_only')
    expect(fetchMock.mock.calls.filter(call => parseGraphQLCall(call).query.includes('CreateTodo'))).toHaveLength(0)

    const persisted = await loadOfflineStore(USER_ID)
    expect(persisted.localOnly).toBe(true)
    expect(persisted.localOnlyMigration).toBeNull()
    expect(persisted.baselineSnapshot).toEqual([])
    expect(persisted.queue).toHaveLength(0)
    expect(
      fetchMock.mock.calls.map(call => parseGraphQLCall(call).query),
    ).toEqual(expect.arrayContaining([
      expect.stringContaining('PrepareLocalOnly'),
      expect.stringContaining('CommitLocalOnly'),
    ]))
  })

  it('queues upload operations only after local-only mode is disabled with confirmation', async () => {
    mockEmptyLocalOnlyMigration(fetchMock)

    await enableLocalOnlyMode(store.dispatch, USER_ID)
    await createTodoOfflineAware(store.dispatch, USER_ID, {
      title: 'Local only',
      description: '',
    })

    ;(NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    })
    await disableLocalOnlyMode(store.dispatch, USER_ID, true)

    const persisted = await loadOfflineStore(USER_ID)
    expect(persisted.localOnly).toBe(false)
    expect(persisted.queue.some(op => op.type === 'CREATE')).toBe(true)
  })

  it('cancels without deleting server todos when the prepared checksum is invalid', async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const { query } = parseGraphQLCall([_url, init])

      if (query.includes('PrepareLocalOnly')) {
        return graphqlSuccess({
          prepareTodoLocalOnlyMigration: {
            migrationId: 'migration-bad',
            expiresAt: '2026-07-20T21:00:00.000Z',
            todoCount: 0,
            checksum: 'does-not-match',
            todos: [],
          },
        })
      }

      return graphqlSuccess({
        cancelTodoLocalOnlyMigration: { message: 'Cancelled.' },
      })
    })

    await expect(
      enableLocalOnlyMode(store.dispatch, USER_ID),
    ).rejects.toThrow('checksum does not match')

    const queries = fetchMock.mock.calls.map(call => parseGraphQLCall(call).query)
    expect(queries.some(query => query.includes('CancelLocalOnly'))).toBe(true)
    expect(queries.some(query => query.includes('CommitLocalOnly'))).toBe(false)

    const persisted = await loadOfflineStore(USER_ID)
    expect(persisted.localOnly).toBe(false)
  })

  it('keeps a durable snapshot and resumes an uncertain commit', async () => {
    fetchMock
      .mockResolvedValueOnce(graphqlSuccess({
        prepareTodoLocalOnlyMigration: {
          migrationId: 'migration-retry',
          expiresAt: '2026-07-20T21:00:00.000Z',
          todoCount: 0,
          checksum: 'verified-checksum',
          todos: [],
        },
      }))
      .mockResolvedValueOnce(graphqlError('INTERNAL_SERVER_ERROR'))
      .mockResolvedValueOnce(graphqlSuccess({
        commitTodoLocalOnlyMigration: {
          migrationId: 'migration-retry',
          deletedCount: 0,
          committedAt: '2026-07-20T20:55:00.000Z',
        },
      }))

    const enabled = await enableLocalOnlyMode(store.dispatch, USER_ID)

    expect(enabled.localOnly).toBe(true)
    expect(enabled.localOnlyMigration?.migrationId).toBe('migration-retry')

    const committed = await resumeLocalOnlyMigration(store.dispatch, USER_ID)
    expect(committed.localOnlyMigration).toBeNull()
    expect(committed.baselineSnapshot).toEqual([])
  })

  it('paginates by total count instead of treating last as a page number', async () => {
    const makeTodo = (index: number) => ({
      id: `todo-${index}`,
      title: `Todo ${index}`,
      description: '',
      done: false,
      dueTo: null,
      reminderOn: null,
      createdAt: '2026-07-20T20:00:00.000Z',
      updatedAt: '2026-07-20T20:00:00.000Z',
    })

    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const { variables } = parseGraphQLCall([_url, init])
      const currentPage = variables.pagination.currentPage as number
      const data = currentPage === 1
        ? Array.from({ length: 50 }, (_, index) => makeTodo(index + 1))
        : [makeTodo(51)]

      return graphqlSuccess({
        todos: {
          data,
          first: currentPage === 1 ? 1 : 51,
          last: currentPage === 1 ? 50 : 51,
          limit: 50,
          total: 51,
        },
      })
    })

    const todos = await refreshTodosFromServer(store.dispatch, USER_ID)

    expect(todos).toHaveLength(51)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(
      fetchMock.mock.calls.map(call =>
        parseGraphQLCall(call).variables.pagination.currentPage
      ),
    ).toEqual([1, 2])
  })

  it('keeps a pending local edit authoritative during server reconciliation', async () => {
    const serverTodo = {
      id: 'server-pending',
      title: 'Pending edit',
      description: '',
      done: false,
      dueTo: null,
      reminderOn: null,
      createdAt: '2026-07-20T20:00:00.000Z',
      updatedAt: '2026-07-20T20:00:00.000Z',
    }
    const page = graphqlSuccess({
      todos: {
        data: [serverTodo],
        first: 1,
        last: 1,
        limit: 50,
        total: 1,
      },
    })

    fetchMock.mockResolvedValueOnce(page)
    const [initial] = await refreshTodosFromServer(store.dispatch, USER_ID)

    fetchMock.mockRejectedValueOnce(new Error('offline during update'))
    const pending = await updateTodoOfflineAware(store.dispatch, USER_ID, {
      id: initial.id,
      done: true,
    })
    expect(pending.syncStatus).toBe('pending')

    fetchMock.mockResolvedValueOnce(page)
    const [reconciled] = await refreshTodosFromServer(store.dispatch, USER_ID)

    expect(reconciled.done).toBe(true)
    expect(reconciled.syncStatus).toBe('pending')
  })
})
