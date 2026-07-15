import { baseQueryWithReauth } from '@/config/redux/api'
import { setCredentials } from '@/features/auth/authFlowSlice'
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
  storedRefreshToken,
  TestStore,
} from '@/test-utils'
import type { BaseQueryApi } from '@reduxjs/toolkit/query'

const TODOS_DOC = 'query Todos { todos { data { id } } }'

function apiFor(store: TestStore): BaseQueryApi {
  return {
    getState: store.getState,
    dispatch: store.dispatch,
    signal: undefined as unknown as AbortSignal,
    abort: jest.fn(),
    extra: undefined,
    endpoint: 'fetchTodos',
    type: 'query',
  } as unknown as BaseQueryApi
}

function isRefreshCall(call: [RequestInfo | URL, RequestInit?]): boolean {
  return parseGraphQLCall(call).query.includes('mutation RefreshToken')
}

describe('baseQueryWithReauth', () => {
  let fetchMock: jest.Mock
  let store: TestStore

  beforeEach(async () => {
    fetchMock = mockFetch()
    store = createTestStore()
    await clearStoredTokens()
  })

  afterEach(async () => {
    await teardownStore(store)
  })

  async function authenticate(accessToken = 'expired-access', refreshToken = 'refresh-old') {
    store.dispatch(setCredentials(authPayloadFixture({ accessToken, refreshToken })))
    await seedRefreshToken(refreshToken)
  }

  it('refreshes once and retries the failed operation exactly once', async () => {
    await authenticate()

    fetchMock
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))
      .mockResolvedValueOnce(graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'access-new', refreshToken: 'refresh-new' }),
      }))
      .mockResolvedValueOnce(graphqlSuccess({ todos: { data: [] } }))

    const result = await baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {})

    expect(result.data).toEqual({ todos: { data: [] } })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    const [original, refresh, retry] = fetchMock.mock.calls.map(parseGraphQLCall)

    expect(original.headers.authorization).toBe('Bearer expired-access')
    // the expired access token is never attached to the refresh mutation
    expect(refresh.query).toContain('mutation RefreshToken')
    expect(refresh.headers.authorization).toBeUndefined()
    expect(refresh.variables.input.refreshToken).toBe('refresh-old')
    // the retry uses the rotated access token
    expect(retry.headers.authorization).toBe('Bearer access-new')
  })

  it('replaces both tokens atomically after a successful refresh', async () => {
    await authenticate()

    fetchMock
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))
      .mockResolvedValueOnce(graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'access-new', refreshToken: 'refresh-new' }),
      }))
      .mockResolvedValueOnce(graphqlSuccess({ todos: { data: [] } }))

    await baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {})

    expect(store.getState().auth.accessToken).toBe('access-new')
    await expect(storedRefreshToken()).resolves.toBe('refresh-new')
  })

  it('performs exactly one refresh for concurrent expired operations', async () => {
    await authenticate()

    let resolveRefresh: (value: Response) => void

    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const { query, headers } = parseGraphQLCall([_url, init])

      if (query.includes('mutation RefreshToken')) {
        return new Promise<Response>(resolve => {
          resolveRefresh = resolve
        })
      }

      if ((headers as Record<string, string>).authorization === 'Bearer access-new') {
        return graphqlSuccess({ todos: { data: [] } })
      }

      return graphqlError('UNAUTHENTICATED')
    })

    const inflight = Promise.all([
      baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {}),
      baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {}),
      baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {}),
    ])

    // let both original requests fail and queue behind the refresh
    await new Promise(resolve => setTimeout(resolve, 10))
    resolveRefresh!(graphqlSuccess({
      refreshToken: authPayloadFixture({ accessToken: 'access-new', refreshToken: 'refresh-new' }),
    }))

    const results = await inflight

    results.forEach(result => expect(result.data).toEqual({ todos: { data: [] } }))

    const refreshCalls = fetchMock.mock.calls.filter(isRefreshCall)
    expect(refreshCalls).toHaveLength(1)
    // 3 originals + 1 refresh + 3 retries
    expect(fetchMock).toHaveBeenCalledTimes(7)
  })

  it('clears all auth state when the refresh fails', async () => {
    await authenticate()

    fetchMock
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    const result = await baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {})

    expect(result.error).toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(store.getState().auth.accessToken).toBeNull()
    expect(store.getState().auth.sessionStatus).toBe('unauthenticated')
    await expect(storedRefreshToken()).resolves.toBeNull()
    // no retry happened after the failed refresh
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not recurse when the refresh itself is UNAUTHENTICATED', async () => {
    await authenticate()

    fetchMock
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    await baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {})

    const refreshCalls = fetchMock.mock.calls.filter(isRefreshCall)
    expect(refreshCalls).toHaveLength(1)
  })

  it('never retries an operation more than once', async () => {
    await authenticate()

    fetchMock
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))
      .mockResolvedValueOnce(graphqlSuccess({
        refreshToken: authPayloadFixture({ accessToken: 'access-new', refreshToken: 'refresh-new' }),
      }))
      .mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    const result = await baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {})

    // the retry's failure is returned as-is: no second refresh, no second retry
    expect(result.error).toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('never refreshes anonymous operations (login, register, resets)', async () => {
    await seedRefreshToken('refresh-old')

    fetchMock.mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    const result = await baseQueryWithReauth(
      { document: 'mutation Login { login }', anonymous: true },
      apiFor(store),
      {}
    )

    expect(result.error).toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('clears state without refreshing when no refresh token is stored', async () => {
    store.dispatch(setCredentials(authPayloadFixture({ accessToken: 'expired-access' })))
    await clearStoredTokens()

    fetchMock.mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    const result = await baseQueryWithReauth({ document: TODOS_DOC }, apiFor(store), {})

    expect(result.error).toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.getState().auth.sessionStatus).toBe('unauthenticated')
  })
})
