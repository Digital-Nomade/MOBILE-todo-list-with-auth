import { useAppDispatch, useAppSelector } from '@/config/redux/hooks'
import { filterTodosByQuery } from '@/components/features/Dashboard/TodoSearchModal/filterTodosByQuery'
import { getErrorCode, getUserFacingMessage } from '@/config/graphql/errors'
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
  searchServerTodos,
  updateTodoOfflineAware,
} from './todoService'

export function useTodoSyncState() {
  return useAppSelector(selectTodoSyncState)
}

export function useOfflineTodos() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, canUseBackend } = useSession()
  const todos = useAppSelector(selectOfflineTodos)
  const syncState = useAppSelector(selectTodoSyncState)
  const isHydrated = useAppSelector(state => state.offlineTodos.isHydrated)
  const [isFetching, setIsFetching] = useState(false)

  const refetch = useCallback(async () => {
    if (!user?.id || !canUseBackend) {
      return
    }

    setIsFetching(true)
    try {
      await refreshTodosFromServer(dispatch, user.id)
    } finally {
      setIsFetching(false)
    }
  }, [canUseBackend, dispatch, user?.id])

  return {
    data: todos,
    isLoading: isAuthenticated && Boolean(user?.id) && !isHydrated,
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

export function useTodoSearch(term: string) {
  const dispatch = useAppDispatch()
  const { canUseBackend } = useSession()
  const localTodos = useAppSelector(selectOfflineTodos)
  const { localOnly, isOnline } = useAppSelector(selectTodoSyncState)
  const [results, setResults] = useState<TodoViewModel[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [usedLocalFallback, setUsedLocalFallback] = useState(false)

  const normalizedTerm = term.trim()
  const isLocalSearch = localOnly || !canUseBackend || !isOnline

  useEffect(() => {
    if (!normalizedTerm) {
      setResults([])
      setIsSearching(false)
      setSearchError(null)
      setUsedLocalFallback(false)
      return
    }

    if (isLocalSearch) {
      setResults(filterTodosByQuery(localTodos, normalizedTerm))
      setIsSearching(false)
      setSearchError(null)
      setUsedLocalFallback(false)
      return
    }

    let cancelled = false
    setIsSearching(true)
    setSearchError(null)
    setUsedLocalFallback(false)

    searchServerTodos(dispatch, normalizedTerm)
      .then(found => {
        if (!cancelled) {
          setResults(found)
        }
      })
      .catch(error => {
        if (!cancelled) {
          if (getErrorCode(error) === 'NETWORK_ERROR') {
            setResults(filterTodosByQuery(localTodos, normalizedTerm))
            setUsedLocalFallback(true)
          } else {
            setResults([])
            setSearchError(getUserFacingMessage(error))
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearching(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, isLocalSearch, localTodos, normalizedTerm])

  return {
    results,
    isSearching,
    isLocalSearch: isLocalSearch || usedLocalFallback,
    searchError,
  }
}
