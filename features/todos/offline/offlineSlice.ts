import {
  LocalTodoRecord,
  SyncCoordinatorStatus,
  TodoSyncState,
  TodoViewModel,
} from '@/types/todo-types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { todoToViewModel } from './mappers'

export interface OfflineSliceState extends TodoSyncState {
  userId: string | null
  todos: TodoViewModel[]
  isHydrated: boolean
}

const initialState: OfflineSliceState = {
  userId: null,
  todos: [],
  isHydrated: false,
  isOnline: true,
  localOnly: false,
  pendingCount: 0,
  coordinatorStatus: 'idle',
  lastSyncAt: null,
  lastError: null,
}

const offlineSlice = createSlice({
  name: 'offlineTodos',
  initialState,
  reducers: {
    resetOfflineState: () => initialState,
    setOfflineUser: (state, action: PayloadAction<string | null>) => {
      if (state.userId !== action.payload) {
        return {
          ...initialState,
          userId: action.payload,
          isOnline: state.isOnline,
        }
      }
    },
    setHydratedTodos: (
      state,
      action: PayloadAction<{
        records: LocalTodoRecord[]
        localOnly: boolean
        pendingCount: number
        lastSyncAt: string | null
      }>
    ) => {
      state.todos = action.payload.records.map(todoToViewModel)
      state.localOnly = action.payload.localOnly
      state.pendingCount = action.payload.pendingCount
      state.lastSyncAt = action.payload.lastSyncAt
      state.isHydrated = true
    },
    setConnectivity: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },
    setCoordinatorStatus: (
      state,
      action: PayloadAction<{ status: SyncCoordinatorStatus; error?: string | null }>
    ) => {
      state.coordinatorStatus = action.payload.status
      state.lastError = action.payload.error ?? null
    },
    setSyncMeta: (
      state,
      action: PayloadAction<{ pendingCount: number; lastSyncAt: string | null }>
    ) => {
      state.pendingCount = action.payload.pendingCount
      state.lastSyncAt = action.payload.lastSyncAt
    },
    upsertTodoView: (state, action: PayloadAction<LocalTodoRecord>) => {
      const view = todoToViewModel(action.payload)
      const index = state.todos.findIndex(item => item.localId === view.localId)

      if (index >= 0) {
        state.todos[index] = view
      } else {
        state.todos.unshift(view)
      }
    },
    removeTodoView: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter(item => item.localId !== action.payload)
    },
    setLocalOnly: (state, action: PayloadAction<boolean>) => {
      state.localOnly = action.payload
    },
  },
})

export const {
  resetOfflineState,
  setOfflineUser,
  setHydratedTodos,
  setConnectivity,
  setCoordinatorStatus,
  setSyncMeta,
  upsertTodoView,
  removeTodoView,
  setLocalOnly,
} = offlineSlice.actions

export default offlineSlice.reducer

export function selectOfflineTodos(state: { offlineTodos: OfflineSliceState }): TodoViewModel[] {
  return state.offlineTodos.todos
}

export function selectOfflineTodoById(
  state: { offlineTodos: OfflineSliceState },
  localId: string
): TodoViewModel | undefined {
  return state.offlineTodos.todos.find(item => item.localId === localId || item.serverId === localId)
}

export function selectTodoSyncState(state: { offlineTodos: OfflineSliceState }): TodoSyncState {
  const { isOnline, localOnly, pendingCount, coordinatorStatus, lastSyncAt, lastError } = state.offlineTodos
  return { isOnline, localOnly, pendingCount, coordinatorStatus, lastSyncAt, lastError }
}
