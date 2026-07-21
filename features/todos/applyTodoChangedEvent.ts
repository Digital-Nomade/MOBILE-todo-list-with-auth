import { UserOfflineStore } from '@/types/todo-types'
import { serverTodoToLocalRecord } from './offline/mappers'
import { TodoChangedEvent } from './todoSubscription'

function hasPendingLocalEdits(record: UserOfflineStore['todos'][number]): boolean {
  return (
    record.syncStatus === 'pending' ||
    record.syncStatus === 'failed' ||
    record.serverId === null
  )
}

/**
 * Applies a live todoChanged event to the offline store.
 * Pending local edits stay authoritative until they sync.
 */
export function applyTodoChangedEventToStore(
  store: UserOfflineStore,
  event: TodoChangedEvent,
): UserOfflineStore {
  if (store.localOnly) {
    return store
  }

  if (event.type === 'DELETED') {
    return {
      ...store,
      todos: store.todos.filter(
        todo => todo.serverId !== event.todoId && todo.localId !== event.todoId,
      ),
    }
  }

  if (!event.todo) {
    return store
  }

  const incoming = serverTodoToLocalRecord(event.todo)
  const existingIndex = store.todos.findIndex(
    todo => todo.serverId === event.todoId || todo.localId === event.todoId,
  )

  if (existingIndex >= 0) {
    const existing = store.todos[existingIndex]

    if (hasPendingLocalEdits(existing)) {
      return store
    }

    const todos = [...store.todos]
    todos[existingIndex] = incoming
    return { ...store, todos }
  }

  return {
    ...store,
    todos: [incoming, ...store.todos],
  }
}
