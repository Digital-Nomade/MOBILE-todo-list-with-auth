import { Config } from '@/constants/Config'
import { Todo } from '@/types/todo-types'
import { TODO_CHANGED_SUBSCRIPTION } from './documents'

export interface TodoChangedEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED'
  todoId: string
  occurredAt: string
  todo: Todo | null
}

interface SubscriptionOptions {
  getAccessToken: () => string | null
  onConnected: (reconnected: boolean) => void
  onTodoChanged: (event: TodoChangedEvent) => void
  onError?: (error: unknown) => void
  retryDelayMs?: number
}

interface ProtocolMessage {
  id?: string
  type?: string
  payload?: {
    data?: {
      todoChanged?: TodoChangedEvent
    }
  }
}

const OPERATION_ID = 'todo-changed'

function isPermanentSubscriptionError(payload: unknown): boolean {
  const serialized = JSON.stringify(payload ?? '').toUpperCase()

  return (
    serialized.includes('UNAUTHENTICATED') ||
    serialized.includes('FORBIDDEN') ||
    serialized.includes('UNAUTHORIZED')
  )
}

/**
 * Minimal graphql-transport-ws client for the app's single subscription.
 * A fresh access token is read for every connection attempt.
 */
export function startTodoChangedSubscription({
  getAccessToken,
  onConnected,
  onTodoChanged,
  onError,
  retryDelayMs = 1000,
}: SubscriptionOptions): () => void {
  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let stopped = false
  let authBlocked = false
  let connectedBefore = false

  function scheduleReconnect() {
    if (stopped || retryTimer || authBlocked) {
      return
    }

    retryTimer = setTimeout(() => {
      retryTimer = null
      connect()
    }, retryDelayMs)
  }

  function connect() {
    if (stopped) {
      return
    }

    const accessToken = getAccessToken()

    if (!accessToken) {
      scheduleReconnect()
      return
    }

    authBlocked = false
    socket = new WebSocket(Config.graphqlWsUrl, 'graphql-transport-ws')

    socket.onopen = () => {
      socket?.send(JSON.stringify({
        type: 'connection_init',
        payload: {
          Authorization: `Bearer ${accessToken}`,
        },
      }))
    }

    socket.onmessage = (event) => {
      let message: ProtocolMessage

      try {
        message = JSON.parse(String(event.data)) as ProtocolMessage
      } catch {
        return
      }

      if (message.type === 'connection_ack') {
        onConnected(connectedBefore)
        connectedBefore = true
        socket?.send(JSON.stringify({
          id: OPERATION_ID,
          type: 'subscribe',
          payload: {
            query: TODO_CHANGED_SUBSCRIPTION,
            variables: {},
          },
        }))
        return
      }

      if (message.type === 'ping') {
        socket?.send(JSON.stringify({ type: 'pong' }))
        return
      }

      if (message.type === 'error' || message.type === 'complete') {
        if (message.type === 'error') {
          onError?.(message.payload ?? message)
          if (isPermanentSubscriptionError(message.payload ?? message)) {
            authBlocked = true
          }
        }
        socket?.close()
        return
      }

      const change = message.type === 'next'
        ? message.payload?.data?.todoChanged
        : undefined

      if (change) {
        onTodoChanged(change)
      }
    }

    socket.onerror = () => {
      socket?.close()
    }

    socket.onclose = () => {
      socket = null
      if (!authBlocked) {
        scheduleReconnect()
      }
    }
  }

  connect()

  return () => {
    stopped = true

    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ id: OPERATION_ID, type: 'complete' }))
    }

    socket?.close()
    socket = null
  }
}
