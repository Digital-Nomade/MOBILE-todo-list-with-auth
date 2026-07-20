import { setCredentials } from '@/features/auth/authFlowSlice'
import { todoApi } from '@/features/todos/todoApi'
import {
  authPayloadFixture,
  clearStoredTokens,
  createTestStore,
  graphqlError,
  graphqlSuccess,
  mockFetch,
  parseGraphQLCall,
  teardownStore,
  seedRefreshToken,
  TestStore,
} from '@/test-utils'

const TODO_ID = '3f2b8f64-9c1d-4e4a-8f6a-1a2b3c4d5e6f'

const todoFixture = {
  id: TODO_ID,
  title: 'Buy fruits',
  description: '',
  done: false,
  dueTo: null,
  reminderOn: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

describe('todoApi', () => {
  let fetchMock: jest.Mock
  let store: TestStore

  beforeEach(async () => {
    fetchMock = mockFetch()
    store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'access-1', refreshToken: 'refresh-1' })))
    await seedRefreshToken('refresh-1')
  })

  afterEach(async () => {
    await teardownStore(store)
    await clearStoredTokens()
  })

  it('fetches todos with the default pagination and the access token attached', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({
      todos: { data: [todoFixture], first: 1, last: 1, limit: 10, total: 1 },
    }))

    const result = await store.dispatch(todoApi.endpoints.fetchTodos.initiate()).unwrap()

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.variables.pagination).toEqual({ currentPage: 1, limit: 10, orderBy: 'DESC' })
    expect(call.headers.authorization).toBe('Bearer access-1')

    expect(result.data[0].id).toBe(TODO_ID)
    expect(typeof result.data[0].id).toBe('string')
  })

  it('sends DateTime inputs as ISO-8601 strings when creating todos', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({ createTodo: todoFixture }))

    const dueTo = new Date('2026-08-01T12:00:00.000Z')

    await store.dispatch(
      todoApi.endpoints.createTodo.initiate({
        title: 'Buy fruits',
        description: 'apples and pears',
        dueTo,
      })
    ).unwrap()

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.variables.input.dueTo).toBe('2026-08-01T12:00:00.000Z')
    expect(call.variables.input.title).toBe('Buy fruits')
  })

  it('updates todos by UUID string id, sending only UpdateTodo input fields', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({ updateTodo: { ...todoFixture, done: true } }))

    await store.dispatch(
      todoApi.endpoints.updateTodo.initiate({ id: TODO_ID, done: true })
    ).unwrap()

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.variables.id).toBe(TODO_ID)
    expect(call.variables.input.done).toBe(true)
    // server-managed fields never leak into the update input
    expect(call.variables.input.id).toBeUndefined()
    expect(call.variables.input.createdAt).toBeUndefined()
    expect(call.variables.input.updatedAt).toBeUndefined()
  })

  it('treats HTTP 200 with a GraphQL errors array as a failed operation', async () => {
    fetchMock.mockResolvedValueOnce(graphqlError('FORBIDDEN'))

    await expect(
      store.dispatch(todoApi.endpoints.fetchTodo.initiate(TODO_ID)).unwrap()
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('refetches the cached todo list after a mutation invalidates it', async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const { query } = parseGraphQLCall([_url, init])

      if (query.includes('query Todos')) {
        return graphqlSuccess({
          todos: { data: [todoFixture], first: 1, last: 1, limit: 10, total: 1 },
        })
      }

      return graphqlSuccess({ createTodo: todoFixture })
    })

    // active subscription keeps the list cached
    const subscription = store.dispatch(todoApi.endpoints.fetchTodos.initiate())
    await subscription.unwrap()

    const listCallsBefore = fetchMock.mock.calls
      .filter(call => parseGraphQLCall(call).query.includes('query Todos'))
      .length
    expect(listCallsBefore).toBe(1)

    await store.dispatch(
      todoApi.endpoints.createTodo.initiate({ title: 'New', description: '' })
    ).unwrap()

    // allow the invalidation-driven refetch to run
    await new Promise(resolve => setTimeout(resolve, 20))

    const listCallsAfter = fetchMock.mock.calls
      .filter(call => parseGraphQLCall(call).query.includes('query Todos'))
      .length
    expect(listCallsAfter).toBe(2)

    subscription.unsubscribe()
  })

  it('searches todos by term with pagination and the access token attached', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({
      searchTodos: { data: [todoFixture], first: 1, last: 1, limit: 50, total: 1 },
    }))

    const result = await store.dispatch(
      todoApi.endpoints.searchTodos.initiate({
        term: 'fruits',
        currentPage: 1,
        limit: 50,
        orderBy: 'DESC',
      }),
    ).unwrap()

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.query).toContain('query SearchTodos')
    expect(call.variables.term).toBe('fruits')
    expect(call.variables.pagination).toEqual({ currentPage: 1, limit: 50, orderBy: 'DESC' })
    expect(call.headers.authorization).toBe('Bearer access-1')
    expect(result.data[0].id).toBe(TODO_ID)
  })

  it('deletes todos by UUID string id', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({ deleteTodo: true }))

    const result = await store.dispatch(todoApi.endpoints.deleteTodo.initiate(TODO_ID)).unwrap()

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.query).toContain('mutation DeleteTodo')
    expect(call.variables.id).toBe(TODO_ID)
    expect(result).toBe(true)
  })

  it('uses the prepare, commit, and cancel local-only migration contract', async () => {
    fetchMock
      .mockResolvedValueOnce(graphqlSuccess({
        prepareTodoLocalOnlyMigration: {
          migrationId: 'migration-1',
          expiresAt: '2026-07-20T21:00:00.000Z',
          todoCount: 1,
          checksum: 'checksum',
          todos: [todoFixture],
        },
      }))
      .mockResolvedValueOnce(graphqlSuccess({
        commitTodoLocalOnlyMigration: {
          migrationId: 'migration-1',
          deletedCount: 1,
          committedAt: '2026-07-20T20:50:00.000Z',
        },
      }))
      .mockResolvedValueOnce(graphqlSuccess({
        cancelTodoLocalOnlyMigration: { message: 'Cancelled.' },
      }))

    await store.dispatch(todoApi.endpoints.prepareLocalOnlyMigration.initiate()).unwrap()
    await store.dispatch(todoApi.endpoints.commitLocalOnlyMigration.initiate('migration-1')).unwrap()
    await store.dispatch(todoApi.endpoints.cancelLocalOnlyMigration.initiate('migration-1')).unwrap()

    const calls = fetchMock.mock.calls.map(call => parseGraphQLCall(call))
    expect(calls[0].query).toContain('mutation PrepareLocalOnly')
    expect(calls[1].variables).toEqual({ migrationId: 'migration-1' })
    expect(calls[2].query).toContain('mutation CancelLocalOnly')
  })
})
