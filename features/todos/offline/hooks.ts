import { useAppDispatch, useAppSelector } from '@/config/redux/hooks'
import { useSession } from '@/hooks/useSession'
import {
  TodoCreationPayload,
  TodoUpdatePayload,
  TodoViewModel,
} from '@/types/todo-types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  selectOfflineTodoById,
  selectOfflineTodos,
  selectTodoSyncState,
} from './offlineSlice'
import {
  createTodoOfflineAware,
  deleteTodoOfflineAware,
  getTodoById,
  refreshTodosFromServer,
  updateTodoOfflineAware,
} from './todoService'

export function useTodoSyncState() {
  return useAppSelector(selectTodoSyncState)
}

export function useOfflineTodos() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useSession()
  const todos = useAppSelector(selectOfflineTodos)
  const syncState = useAppSelector(selectTodoSyncState)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const refetch = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setIsFetching(true)
    try {
      await refreshTodosFromServer(dispatch, user.id)
    } finally {
      setIsFetching(false)
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    refreshTodosFromServer(dispatch, user.id)
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, isAuthenticated, user?.id])

  return {
    data: todos,
    isLoading,
    isFetching,
    refetch,
    syncState,
  }
}

export function useOfflineTodo(todoId: string | undefined, options?: { skip?: boolean }) {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useSession()
  const cached = useAppSelector(state =>
    todoId ? selectOfflineTodoById(state, todoId) : undefined
  )
  const [data, setData] = useState<TodoViewModel | undefined>(cached)
  const [isLoading, setIsLoading] = useState(!cached && Boolean(todoId))
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    setData(cached)
  }, [cached])

  useEffect(() => {
    if (options?.skip || !todoId || !isAuthenticated || !user?.id || cached) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    getTodoById(dispatch, user.id, todoId)
      .then(result => {
        if (!cancelled) {
          setData(result ?? undefined)
          setError(result ? null : { message: 'Todo not found' })
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [cached, dispatch, isAuthenticated, options?.skip, todoId, user?.id])

  return { data, isLoading, error }
}

export function useOfflineTodoMutations() {
  const dispatch = useAppDispatch()
  const { user } = useSession()

  const createTodo = useCallback(async (payload: TodoCreationPayload) => {
    if (!user?.id) {
      throw new Error('Not authenticated')
    }

    return createTodoOfflineAware(dispatch, user.id, payload)
  }, [dispatch, user?.id])

  const updateTodo = useCallback(async (payload: TodoUpdatePayload) => {
    if (!user?.id) {
      throw new Error('Not authenticated')
    }

    return updateTodoOfflineAware(dispatch, user.id, payload)
  }, [dispatch, user?.id])

  const deleteTodo = useCallback(async (todoId: string) => {
    if (!user?.id) {
      throw new Error('Not authenticated')
    }

    return deleteTodoOfflineAware(dispatch, user.id, todoId)
  }, [dispatch, user?.id])

  return useMemo(() => ({ createTodo, updateTodo, deleteTodo }), [createTodo, updateTodo, deleteTodo])
}
