import { useAppDispatch, useAppSelector } from '@/config/redux/hooks'
import type { RootState } from '@/config/redux/store'
import { getErrorCode } from '@/config/graphql/errors'
import { useSession } from '@/hooks/useSession'
import { useEffect } from 'react'
import { useStore } from 'react-redux'
import { reconcileAfterTodoChanged } from './offline/todoService'
import { startTodoChangedSubscription, TodoChangedEvent } from './todoSubscription'

/**
 * Listens to authenticated todoChanged subscription events and reconciles
 * local todo state plus RTK Query list/search caches.
 *
 * Mount once inside TodoSyncProvider while the user can reach the backend.
 */
export function TodoSyncListener() {
  const dispatch = useAppDispatch()
  const reduxStore = useStore<RootState>()
  const { user, canUseBackend } = useSession()
  const accessToken = useAppSelector(state => state.auth.accessToken)
  const localOnly = useAppSelector(state => state.offlineTodos.localOnly)
  const isOnline = useAppSelector(state => state.offlineTodos.isOnline)

  useEffect(() => {
    if (!canUseBackend || !user?.id || !accessToken || localOnly || !isOnline) {
      return
    }

    const userId = user.id
    let reconcileInFlight: Promise<void> | null = null
    let reconcileQueued = false
    let queuedEvent: TodoChangedEvent | undefined

    const readAccessToken = () => reduxStore.getState().auth.accessToken

    const canReconcileTodos = () => {
      const { sessionStatus, accessToken: token } = reduxStore.getState().auth
      return sessionStatus === 'authenticated' && Boolean(token)
    }

    const reconcile = (event?: TodoChangedEvent) => {
      if (!canReconcileTodos()) {
        return
      }

      if (event) {
        queuedEvent = event
      }

      if (reconcileInFlight) {
        reconcileQueued = true
        return
      }

      const eventToApply = queuedEvent
      queuedEvent = undefined

      reconcileInFlight = reconcileAfterTodoChanged(dispatch, userId, eventToApply)
        .catch(error => {
          const code = getErrorCode(error)

          if (
            code === 'UNAUTHENTICATED' ||
            code === 'FORBIDDEN' ||
            error instanceof TypeError
          ) {
            return
          }

          console.error('Todo subscription reconciliation failed', error)
        })
        .finally(() => {
          reconcileInFlight = null

          if (reconcileQueued) {
            reconcileQueued = false
            reconcile()
          }
        })
    }

    return startTodoChangedSubscription({
      getAccessToken: readAccessToken,
      onConnected: reconnected => {
        if (reconnected) {
          reconcile()
        }
      },
      onTodoChanged: event => reconcile(event),
      onError: error => {
        console.error('Todo subscription failed', error)
      },
    })
  }, [accessToken, canUseBackend, dispatch, isOnline, localOnly, reduxStore, user?.id])

  return null
}
