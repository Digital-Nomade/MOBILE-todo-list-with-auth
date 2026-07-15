import { useAppDispatch, useAppSelector } from '@/config/redux/hooks';
import { useRestoreSessionMutation } from '@/features/auth/authApi';
import { sessionRestorationFinished } from '@/features/auth/authFlowSlice';
import { getRefreshToken } from '@/features/auth/tokenStorage';
import { useEffect, type PropsWithChildren } from 'react';

/**
 * Read-only view of the auth session. Components never touch tokens directly;
 * all token handling happens in the session layer and reauth middleware.
 */
export function useSession() {
  const { sessionStatus, user } = useAppSelector(state => state.auth)

  return {
    isInitializing: sessionStatus === 'initializing',
    isAuthenticated: sessionStatus === 'authenticated',
    user,
  }
}

/**
 * Restores the session once on startup: loads the stored refresh token and
 * performs a single refresh. The app stays in the `initializing` state until
 * restoration finishes, preventing protected-route flicker.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch()
  const [restoreSession] = useRestoreSessionMutation()

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const refreshToken = await getRefreshToken()

        if (refreshToken && !cancelled) {
          await restoreSession().unwrap()
        }
      } catch {
        // restoreSession already cleared local auth state
      } finally {
        dispatch(sessionRestorationFinished())
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  return <>{children}</>
}
