import { useAppDispatch, useAppSelector } from '@/config/redux/hooks'
import { reconnectOfflineSession } from '@/features/auth/sessionBootstrap'
import { useSession } from '@/hooks/useSession'
import { store } from '@/config/redux/store'
import NetInfo from '@react-native-community/netinfo'
import { createContext, useContext, useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { setConnectivity, setOfflineUser } from './offlineSlice'
import { hydrateOfflineTodos, runTodoSync } from './syncEngine'
import { startTodoChangedSubscription } from '../todoSubscription'
import { initializeTodoData, refreshTodosFromServer } from './todoService'

const TodoSyncContext = createContext<{ ready: boolean }>({ ready: false })

export function TodoSyncProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, canUseBackend } = useSession()
  const localOnly = useAppSelector(state => state.offlineTodos.localOnly)
  const isOnline = useAppSelector(state => state.offlineTodos.isOnline)
  const accessToken = useAppSelector(state => state.auth.accessToken)

  useEffect(() => {
    dispatch(setOfflineUser(isAuthenticated ? user?.id ?? null : null))
  }, [dispatch, isAuthenticated, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    void hydrateOfflineTodos(dispatch, user.id)
  }, [dispatch, isAuthenticated, user?.id])

  useEffect(() => {
    if (!canUseBackend || !user?.id) {
      return
    }

    void initializeTodoData(dispatch, user.id)
  }, [canUseBackend, dispatch, user?.id])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false)
      dispatch(setConnectivity(online))

      if (!online || !user?.id) {
        return
      }

      void (async () => {
        const sessionStatus = store.getState().auth.sessionStatus

        if (sessionStatus === 'offline-authenticated') {
          const reconnectResult = await reconnectOfflineSession(dispatch, store.getState)

          if (reconnectResult === 'authenticated') {
            await initializeTodoData(dispatch, user.id)
            await runTodoSync(dispatch, user.id)
          }

          return
        }

        if (sessionStatus === 'authenticated') {
          await runTodoSync(dispatch, user.id)
        }
      })()
    })

    return unsubscribe
  }, [dispatch, user?.id])

  useEffect(() => {
    function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'active' && canUseBackend && user?.id) {
        void runTodoSync(dispatch, user.id)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState)
    return () => subscription.remove()
  }, [canUseBackend, dispatch, user?.id])

  useEffect(() => {
    if (!canUseBackend || !user?.id || localOnly || !isOnline) {
      return
    }

    let refreshInFlight: Promise<unknown> | null = null
    let refreshQueued = false

    const reconcile = () => {
      if (refreshInFlight) {
        refreshQueued = true
        return
      }

      refreshInFlight = refreshTodosFromServer(dispatch, user.id)
        .catch(() => undefined)
        .finally(() => {
          refreshInFlight = null

          if (refreshQueued) {
            refreshQueued = false
            reconcile()
          }
        })
    }

    return startTodoChangedSubscription({
      getAccessToken: () => accessToken,
      onConnected: (reconnected) => {
        if (reconnected) {
          reconcile()
        }
      },
      onTodoChanged: reconcile,
    })
  }, [accessToken, canUseBackend, dispatch, isOnline, localOnly, user?.id])

  return (
    <TodoSyncContext.Provider value={{ ready: true }}>
      {children}
    </TodoSyncContext.Provider>
  )
}

export function useTodoSyncReady(): boolean {
  return useContext(TodoSyncContext).ready
}
