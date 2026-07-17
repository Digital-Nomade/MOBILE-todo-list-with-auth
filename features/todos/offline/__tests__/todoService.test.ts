import { setCredentials } from '@/features/auth/authFlowSlice'
import NetInfo from '@react-native-community/netinfo'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlSuccess,
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
} from '../todoService'
import { loadOfflineStore } from '../repository'

const USER_ID = 'b3b8f9a0-1c2d-4e5f-8a9b-0c1d2e3f4a5b'

describe('todoService offline routing', () => {
  let fetchMock: jest.Mock
  let store: TestStore

  beforeEach(async () => {
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
    fetchMock.mockResolvedValue(graphqlSuccess({
      todos: {
        data: [],
        first: 0,
        last: 1,
        limit: 50,
        total: 0,
      },
    }))

    await enableLocalOnlyMode(store.dispatch, USER_ID)

    const created = await createTodoOfflineAware(store.dispatch, USER_ID, {
      title: 'Local only',
      description: '',
    })

    expect(created.syncStatus).toBe('local_only')
    expect(fetchMock.mock.calls.filter(call => parseGraphQLCall(call).query.includes('CreateTodo'))).toHaveLength(0)

    const persisted = await loadOfflineStore(USER_ID)
    expect(persisted.localOnly).toBe(true)
    expect(persisted.queue).toHaveLength(0)
  })

  it('queues upload operations only after local-only mode is disabled with confirmation', async () => {
    fetchMock.mockResolvedValue(graphqlSuccess({
      todos: {
        data: [],
        first: 0,
        last: 1,
        limit: 50,
        total: 0,
      },
    }))

    await enableLocalOnlyMode(store.dispatch, USER_ID)
    await createTodoOfflineAware(store.dispatch, USER_ID, {
      title: 'Local only',
      description: '',
    })

    await disableLocalOnlyMode(store.dispatch, USER_ID, true)

    const persisted = await loadOfflineStore(USER_ID)
    expect(persisted.localOnly).toBe(false)
    expect(persisted.queue.some(op => op.type === 'CREATE')).toBe(true)
  })
})
