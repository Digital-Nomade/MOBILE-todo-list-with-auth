import { GraphQLBaseQueryFn, graphqlBaseQuery } from '@/config/graphql/baseQuery'
import { REFRESH_TOKEN_MUTATION } from '@/features/auth/documents'
import { AuthPayload } from '@/features/auth/authTypes'
import { applyAuthPayload, clearSession } from '@/features/auth/session'
import { getRefreshToken } from '@/features/auth/tokenStorage'
import type { BaseQueryApi } from '@reduxjs/toolkit/query'
import { createApi } from '@reduxjs/toolkit/query/react'

/**
 * Single-flight guard: refresh tokens rotate, so the first successful refresh
 * invalidates the previous token. Concurrent failed operations must all wait
 * on the same refresh attempt instead of racing each other.
 */
let refreshPromise: Promise<boolean> | null = null

async function refreshSession(api: BaseQueryApi, extraOptions: {}): Promise<boolean> {
  const refreshToken = await getRefreshToken()

  if (!refreshToken) {
    return false
  }

  // anonymous: the (possibly expired) access token must never be attached to
  // the refresh mutation. Calling graphqlBaseQuery directly also guarantees a
  // failed refresh can never trigger another refresh.
  const result = await graphqlBaseQuery(
    {
      document: REFRESH_TOKEN_MUTATION,
      variables: { input: { refreshToken } },
      anonymous: true,
    },
    api,
    extraOptions
  )

  if (result.error || !result.data) {
    return false
  }

  const payload = (result.data as { refreshToken: AuthPayload }).refreshToken
  await applyAuthPayload(api.dispatch, payload)

  return true
}

/**
 * Wraps the GraphQL transport with the refresh algorithm:
 * - UNAUTHENTICATED on a protected operation triggers at most one refresh
 * - concurrent failures queue behind the same in-flight refresh
 * - each queued operation is retried exactly once after a successful refresh
 * - a failed refresh clears all auth state (route guards then redirect to login)
 * - anonymous operations (login, register, refresh, verification, password
 *   reset) are never refreshed, preventing recursion
 */
export const baseQueryWithReauth: GraphQLBaseQueryFn = async (args, api, extraOptions) => {
  const result = await graphqlBaseQuery(args, api, extraOptions)

  if (args.anonymous || result.error?.code !== 'UNAUTHENTICATED') {
    return result
  }

  if (!refreshPromise) {
    refreshPromise = refreshSession(api, extraOptions).finally(() => {
      refreshPromise = null
    })
  }

  const refreshed = await refreshPromise

  if (!refreshed) {
    await clearSession(api.dispatch)
    return result
  }

  return graphqlBaseQuery(args, api, extraOptions)
}

export const api = createApi({
  keepUnusedDataFor: 0,
  refetchOnReconnect: true,
  reducerPath: 'YouDoMuchMoreAPI',
  tagTypes: [
    'user',
    'todos'
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({})
})
