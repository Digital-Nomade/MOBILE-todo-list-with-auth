import { useAppDispatch, useAppSelector } from '@/config/redux/hooks'
import { store } from '@/config/redux/store'
import { reconnectOfflineSession } from '@/features/auth/sessionBootstrap'
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useRef, type PropsWithChildren } from 'react'
import { bootstrapSession } from '@/features/auth/sessionBootstrap'

/**
 * Read-only view of the auth session. Components never touch tokens directly;
 * all token handling happens in the session layer and reauth middleware.
 */
export function useSession() {
  const { sessionStatus, user } = useAppSelector(state => state.auth)

  const isAuthenticated =
    sessionStatus === 'authenticated' || sessionStatus === 'offline-authenticated'

  return {
    isInitializing: sessionStatus === 'initializing',
    isAuthenticated,
    canUseBackend: sessionStatus === 'authenticated',
    isOfflineAuthenticated: sessionStatus === 'offline-authenticated',
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
  const sessionStatus = useAppSelector(state => state.auth.sessionStatus)
  const bootstrapGeneration = useRef(0)

  useEffect(() => {
    const generation = ++bootstrapGeneration.current
    let cancelled = false

    void bootstrapSession(dispatch, store.getState, {
      cancelled: () => cancelled || bootstrapGeneration.current !== generation,
    })

    return () => {
      cancelled = true
    }
  }, [dispatch])

  useEffect(() => {
    if (sessionStatus !== 'offline-authenticated') {
      return
    }

    const unsubscribe = NetInfo.addEventListener(state => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false)

      if (!online) {
        return
      }

      void reconnectOfflineSession(dispatch, store.getState)
    })

    return unsubscribe
  }, [dispatch, sessionStatus])

  return <>{children}</>
}
