import { GraphQLBaseQueryFn, graphqlBaseQuery } from '@/config/graphql/baseQuery'
import { refreshSessionOnce } from '@/features/auth/refreshSession'
import { clearSession } from '@/features/auth/session'
import { createApi } from '@reduxjs/toolkit/query/react'

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

  const refreshResult = await refreshSessionOnce(api.dispatch, api.getState)

  if (refreshResult.status === 'success') {
    return graphqlBaseQuery(args, api, extraOptions)
  }

  if (refreshResult.status === 'invalid') {
    await clearSession(api.dispatch)
  }

  return result
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
