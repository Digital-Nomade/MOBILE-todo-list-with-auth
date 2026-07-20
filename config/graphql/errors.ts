export type GraphQLErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'TOO_MANY_REQUESTS'
  | 'BAD_USER_INPUT'
  | 'MIGRATION_IN_PROGRESS'
  | 'MIGRATION_NOT_FOUND'
  | 'MIGRATION_EXPIRED'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export interface RawGraphQLError {
  message?: string
  extensions?: {
    code?: string
  }
}

/**
 * The only error shape allowed to leave the transport layer. Raw GraphQL
 * errors are never forwarded because they may embed tokens or internals.
 */
export interface NormalizedGraphQLError {
  code: GraphQLErrorCode
  message: string
}

const KNOWN_CODES: GraphQLErrorCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'TOO_MANY_REQUESTS',
  'BAD_USER_INPUT',
  'MIGRATION_IN_PROGRESS',
  'MIGRATION_NOT_FOUND',
  'MIGRATION_EXPIRED',
  'INTERNAL_SERVER_ERROR',
]

const GENERIC_MESSAGES: Record<GraphQLErrorCode, string> = {
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You are not allowed to perform this action.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a moment and try again.',
  BAD_USER_INPUT: 'Please review the submitted information and try again.',
  MIGRATION_IN_PROGRESS: 'The local-only migration is still in progress.',
  MIGRATION_NOT_FOUND: 'The local-only migration could not be found.',
  MIGRATION_EXPIRED: 'The local-only migration expired. Please try again.',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Unable to reach the server. Check your connection and try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
}

function toKnownCode(rawCode?: string): GraphQLErrorCode {
  return (KNOWN_CODES as string[]).includes(rawCode ?? '')
    ? (rawCode as GraphQLErrorCode)
    : 'UNKNOWN'
}

/**
 * Collapses a GraphQL errors array into a single normalized error, branching
 * on extensions.code only (messages vary by environment).
 */
export function normalizeGraphQLErrors(errors: RawGraphQLError[]): NormalizedGraphQLError {
  const firstError = errors[0]
  const code = toKnownCode(firstError?.extensions?.code)

  // Validation messages are safe and actionable; everything else stays generic.
  const message = code === 'BAD_USER_INPUT' && firstError?.message
    ? firstError.message
    : GENERIC_MESSAGES[code]

  return { code, message }
}

export function isNormalizedGraphQLError(error: unknown): error is NormalizedGraphQLError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

/**
 * Central mapping from an unknown RTK Query error to a user-facing message.
 */
export function getUserFacingMessage(error: unknown, overrides?: Partial<Record<GraphQLErrorCode, string>>): string {
  if (isNormalizedGraphQLError(error)) {
    return overrides?.[error.code] ?? error.message
  }

  return GENERIC_MESSAGES.UNKNOWN
}

export function getErrorCode(error: unknown): GraphQLErrorCode {
  return isNormalizedGraphQLError(error) ? error.code : 'UNKNOWN'
}
