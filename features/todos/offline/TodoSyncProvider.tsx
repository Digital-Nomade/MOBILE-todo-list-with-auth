import { useAppDispatch } from '@/config/redux/hooks'
import { useSession } from '@/hooks/useSession'
import NetInfo from '@react-native-community/netinfo'
import { createContext, useContext, useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { setConnectivity, setOfflineUser } from './offlineSlice'
import { initializeTodoData } from './todoService'
import { runTodoSync } from './syncEngine'

const TodoSyncContext = createContext<{ ready: boolean }>({ ready: false })

export function TodoSyncProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useSession()

  useEffect(() => {
    dispatch(setOfflineUser(isAuthenticated ? user?.id ?? null : null))
  }, [dispatch, isAuthenticated, user?.id])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false)
      dispatch(setConnectivity(online))

      if (online && isAuthenticated && user?.id) {
        void runTodoSync(dispatch, user.id)
      }
    })

    return unsubscribe
  }, [dispatch, isAuthenticated, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    void initializeTodoData(dispatch, user.id)
  }, [dispatch, isAuthenticated, user?.id])

  useEffect(() => {
    function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'active' && isAuthenticated && user?.id) {
        void runTodoSync(dispatch, user.id)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState)
    return () => subscription.remove()
  }, [dispatch, isAuthenticated, user?.id])

  return (
    <TodoSyncContext.Provider value={{ ready: true }}>
      {children}
    </TodoSyncContext.Provider>
  )
}

export function useTodoSyncReady(): boolean {
  return useContext(TodoSyncContext).ready
}
