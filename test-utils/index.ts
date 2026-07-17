import { api } from '@/config/redux/api'
import authReducer from '@/features/auth/authFlowSlice'
import offlineTodosReducer from '@/features/todos/offline/offlineSlice'
import { AuthPayload } from '@/features/auth/authTypes'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import * as SecureStore from 'expo-secure-store'

export function createTestStore() {
  return configureStore({
    reducer: combineReducers({
      auth: authReducer,
      offlineTodos: offlineTodosReducer,
      [api.reducerPath]: api.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(api.middleware),
    // microtask batching instead of requestAnimationFrame: rAF timers would
    // fire after the jest environment is torn down
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers({ autoBatch: { type: 'tick' } }),
  })
}

export type TestStore = ReturnType<typeof createTestStore>

interface GraphQLCall {
  query: string
  variables: Record<string, any>
  headers: Record<string, string>
}

/** Parses a fetch mock invocation into { query, variables, headers }. */
export function parseGraphQLCall(call: [RequestInfo | URL, RequestInit?]): GraphQLCall {
  const [, init] = call

  return {
    ...JSON.parse(String(init?.body)),
    headers: (init?.headers ?? {}) as Record<string, string>,
  }
}

export function graphqlSuccess(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data }),
  } as Response
}

/** GraphQL failure over HTTP 200: must still be treated as an error. */
export function graphqlError(code: string, message = 'error') {
  return {
    ok: true,
    status: 200,
    json: async () => ({ errors: [{ message, extensions: { code } }] }),
  } as Response
}

/** Lets pending RTK Query lifecycle handlers (onQueryStarted) settle. */
export async function flushLifecycle(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
}

/** Clears RTK Query cache timers so nothing fires after the test ends. */
export async function teardownStore(store: TestStore): Promise<void> {
  store.dispatch(api.util.resetApiState())
  await flushLifecycle()
  // keepUnusedDataFor/mutation cleanup timers are scheduled with small
  // delays; wait them out so nothing fires after the jest environment
  // is torn down
  await new Promise(resolve => setTimeout(resolve, 50))
}

export function mockFetch(): jest.Mock {
  const fetchMock = jest.fn()
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

export async function seedRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth.refreshToken', token)
}

export async function storedRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth.refreshToken')
}

export async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync('auth.refreshToken')
}

export function authPayloadFixture(overrides: Partial<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> = {}): AuthPayload {
  return {
    accessToken: overrides.accessToken ?? 'access-token-1',
    refreshToken: overrides.refreshToken ?? 'refresh-token-1',
    expiresIn: overrides.expiresIn ?? 900,
    user: {
      id: 'b3b8f9a0-1c2d-4e5f-8a9b-0c1d2e3f4a5b',
      email: 'user@example.com',
      username: 'user',
      status: 'ACTIVE',
      emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    },
  }
}
