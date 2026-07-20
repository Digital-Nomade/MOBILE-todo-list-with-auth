import { setCredentials, signOut } from './authFlowSlice'
import { AuthPayload } from './authTypes'
import { clearRefreshToken, saveRefreshToken } from './tokenStorage'
import { clearCachedUser, saveCachedUser } from './userCacheStorage'

type Dispatch = (action: unknown) => unknown

/**
 * Persists both rotated tokens atomically: the refresh token is written to
 * secure storage before the new access token becomes visible to the app, so
 * a crash in between can never leave a new access token with a stale refresh
 * token.
 */
export async function applyAuthPayload(dispatch: Dispatch, payload: AuthPayload): Promise<void> {
  await saveRefreshToken(payload.refreshToken)
  await saveCachedUser(payload.user)
  dispatch(setCredentials(payload))
}

/**
 * Clears every piece of local auth state. Storage failures are swallowed so
 * the in-memory session is always cleared, preventing a stale-session trap.
 */
export async function clearSession(dispatch: Dispatch): Promise<void> {
  try {
    await clearRefreshToken()
    await clearCachedUser()
  } finally {
    dispatch(signOut())
  }
}
