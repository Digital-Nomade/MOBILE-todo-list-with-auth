import { todosFixture } from '../fixtures'
import type { TodoCreationPayload, TodoUpdatePayload, TodoViewModel } from '@/types/todo-types'

const todoViews: TodoViewModel[] = todosFixture.map(todo => ({
  ...todo,
  localId: todo.id,
  serverId: todo.id,
  syncStatus: 'synced',
}))

export function useTodoSyncState() {
  return {
    isOnline: true,
    localOnly: false,
    pendingCount: 0,
    coordinatorStatus: 'idle' as const,
    lastSyncAt: null,
    lastError: null,
  }
}

export function useOfflineTodos() {
  return {
    data: todoViews,
    isLoading: false,
    isFetching: false,
    refetch: async () => undefined,
    syncState: useTodoSyncState(),
  }
}

export function useOfflineTodo(todoId: string | undefined) {
  return {
    data: todoViews.find(todo => todo.id === todoId),
    isLoading: false,
    error: null,
  }
}

export function useOfflineTodoMutations() {
  return {
    createTodo: async (_payload: TodoCreationPayload) => todoViews[0],
    updateTodo: async (_payload: TodoUpdatePayload) => todoViews[0],
    deleteTodo: async (_todoId: string) => true,
  }
}
