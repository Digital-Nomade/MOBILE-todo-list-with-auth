import { Config } from '@/constants/Config'
import type { BaseQueryApi, BaseQueryFn } from '@reduxjs/toolkit/query'
import {
  NormalizedGraphQLError,
  normalizeGraphQLErrors,
  RawGraphQLError,
} from './errors'

export interface GraphQLRequest {
  document: string
  variables?: Record<string, unknown>
  /** When true the Authorization header is never attached (login, refresh, etc.) */
  anonymous?: boolean
  /** Stable key for idempotent create retries (backend must honor Idempotency-Key). */
  idempotencyKey?: string
}

export type GraphQLBaseQueryFn = BaseQueryFn<GraphQLRequest, unknown, NormalizedGraphQLError>

interface GraphQLResponseBody {
  data?: unknown
  errors?: RawGraphQLError[]
}

// Structural typing avoids a circular import with the store definition.
interface StateWithAuth {
  auth: {
    accessToken: string | null
  }
}

function buildHeaders(args: GraphQLRequest, api: BaseQueryApi): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }

  if (!args.anonymous) {
    const token = (api.getState() as StateWithAuth).auth.accessToken

    if (token) {
      headers.authorization = `Bearer ${token}`
    }
  }

  if (args.idempotencyKey) {
    headers['Idempotency-Key'] = args.idempotencyKey
  }

  return headers
}

/**
 * Executes a GraphQL operation over POST /graphql.
 *
 * A response is only treated as successful when it carries `data` and no
 * `errors` array: HTTP 200 alone never means success.
 */
export const graphqlBaseQuery: GraphQLBaseQueryFn = async (args, api) => {
  let response: Response
  let body: GraphQLResponseBody | null

  try {
    response = await fetch(Config.graphqlUrl, {
      method: 'POST',
      headers: buildHeaders(args, api),
      body: JSON.stringify({ query: args.document, variables: args.variables ?? {} }),
      signal: api.signal,
    })

    body = (await response.json().catch(() => null)) as GraphQLResponseBody | null
  } catch {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Check your connection and try again.',
      },
    }
  }

  if (body?.errors?.length) {
    return { error: normalizeGraphQLErrors(body.errors) }
  }

  if (!response.ok || body?.data === undefined || body?.data === null) {
    return {
      error: normalizeGraphQLErrors([
        { extensions: { code: response.status === 429 ? 'TOO_MANY_REQUESTS' : 'INTERNAL_SERVER_ERROR' } },
      ]),
    }
  }

  return { data: body.data }
}
