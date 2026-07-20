import { getErrorCode } from '@/config/graphql/errors'
import { AppDispatch } from '@/config/redux/store'
import {
  LocalTodoRecord,
  PaginatedTodos,
  TodoCreationPayload,
  TodoPaginationInput,
  TodoUpdatePayload,
  TodoViewModel,
  UserOfflineStore,
} from '@/types/todo-types'
import * as Crypto from 'expo-crypto'
import NetInfo from '@react-native-community/netinfo'
import { todoApi } from '../todoApi'
import {
  applyUpdateToRecord,
  serverTodoToLocalRecord,
  toISO,
  todoToViewModel,
} from './mappers'
import {
  removeTodoView,
  setHydratedTodos,
  setLocalOnly,
  setSyncMeta,
  upsertTodoView,
} from './offlineSlice'
import { loadOfflineStore, saveOfflineStore, updateOfflineStore } from './repository'
import {
  buildLocalRecordFromCreate,
  buildQueuedCreate,
  buildQueuedDelete,
  buildQueuedUpdate,
  deriveQueueFromBaseline,
  hydrateOfflineTodos,
  runTodoSync,
} from './syncEngine'

const DEFAULT_PAGINATION: TodoPaginationInput = {
  currentPage: 1,
  limit: 50,
  orderBy: 'DESC',
}

async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return Boolean(state.isConnected && state.isInternetReachable !== false)
}

async function fetchAllServerTodos(dispatch: AppDispatch): Promise<LocalTodoRecord[]> {
  const records: LocalTodoRecord[] = []
  let currentPage = 1
  let lastPage = 1

  do {
    const page = await dispatch(
      todoApi.endpoints.fetchTodos.initiate({ ...DEFAULT_PAGINATION, currentPage })
    ).unwrap()

    records.push(...page.data.map(todo => serverTodoToLocalRecord(todo)))
    lastPage = page.last || 1
    currentPage += 1
  } while (currentPage <= lastPage)

  return records
}

function publishStore(dispatch: AppDispatch, store: UserOfflineStore): void {
  dispatch(setHydratedTodos({
    records: store.todos,
    localOnly: store.localOnly,
    pendingCount: store.queue.length,
    lastSyncAt: store.lastSyncAt,
  }))
}

export async function searchServerTodos(
  dispatch: AppDispatch,
  term: string,
): Promise<TodoViewModel[]> {
  const normalized = term.trim()

  if (!normalized) {
    return []
  }

  try {
    const page = await dispatch(
      todoApi.endpoints.searchTodos.initiate({
        term: normalized,
        ...DEFAULT_PAGINATION,
        limit: 50,
      }),
    ).unwrap()

    return page.data.map(todo => todoToViewModel(serverTodoToLocalRecord(todo)))
  } catch (error) {
    if (getErrorCode(error) === 'NETWORK_ERROR') {
      return []
    }

    throw error
  }
}

export async function refreshTodosFromServer(
  dispatch: AppDispatch,
  userId: string
): Promise<TodoViewModel[]> {
  const online = await isDeviceOnline()
  const store = await loadOfflineStore(userId)

  if (!online || store.localOnly) {
    publishStore(dispatch, store)
    return store.todos.map(todoToViewModel)
  }

  try {
    const serverRecords = await fetchAllServerTodos(dispatch)
    const merged = mergeServerWithPendingLocal(store, serverRecords)
    const nextStore: UserOfflineStore = {
      ...store,
      todos: merged,
      lastSyncAt: new Date().toISOString(),
    }

    await saveOfflineStore(nextStore)
    publishStore(dispatch, nextStore)

    if (nextStore.queue.length > 0) {
      void runTodoSync(dispatch, userId)
    }

    return nextStore.todos.map(todoToViewModel)
  } catch (error) {
    publishStore(dispatch, store)

    if (getErrorCode(error) === 'NETWORK_ERROR') {
      return store.todos.map(todoToViewModel)
    }

    throw error
  }
}

function mergeServerWithPendingLocal(
  store: UserOfflineStore,
  serverRecords: LocalTodoRecord[]
): LocalTodoRecord[] {
  const pendingLocal = store.todos.filter(item =>
    item.syncStatus === 'pending' ||
    item.syncStatus === 'failed' ||
    item.syncStatus === 'local_only' ||
    item.serverId === null
  )

  const byServerId = new Map(serverRecords.map(item => [item.serverId ?? item.localId, item]))
  const merged = [...serverRecords]

  for (const local of pendingLocal) {
    if (local.serverId && byServerId.has(local.serverId)) {
      continue
    }

    if (!merged.some(item => item.localId === local.localId)) {
      merged.unshift(local)
    }
  }

  return merged.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getTodoById(
  dispatch: AppDispatch,
  userId: string,
  todoId: string
): Promise<TodoViewModel | null> {
  const store = await loadOfflineStore(userId)
  const record = store.todos.find(item => item.localId === todoId || item.serverId === todoId)

  if (record) {
    return todoToViewModel(record)
  }

  if (store.localOnly || !(await isDeviceOnline())) {
    return null
  }

  try {
    const remote = await dispatch(todoApi.endpoints.fetchTodo.initiate(todoId)).unwrap()
    const localRecord = serverTodoToLocalRecord(remote)
    const nextStore: UserOfflineStore = {
      ...store,
      todos: [localRecord, ...store.todos.filter(item => item.localId !== localRecord.localId)],
    }
    await saveOfflineStore(nextStore)
    dispatch(upsertTodoView(localRecord))
    return todoToViewModel(localRecord)
  } catch {
    return null
  }
}

export async function createTodoOfflineAware(
  dispatch: AppDispatch,
  userId: string,
  payload: TodoCreationPayload
): Promise<TodoViewModel> {
  const normalized = {
    title: payload.title,
    description: payload.description,
    dueTo: toISO(payload.dueTo) ?? null,
    reminderOn: toISO(payload.reminderOn) ?? null,
  }

  const localId = Crypto.randomUUID()
  let store = await loadOfflineStore(userId)

  if (store.localOnly) {
    const record = buildLocalRecordFromCreate(localId, normalized, 'local_only')
    store = {
      ...store,
      todos: [record, ...store.todos],
    }
    await saveOfflineStore(store)
    dispatch(upsertTodoView(record))
    return todoToViewModel(record)
  }

  const online = await isDeviceOnline()

  if (online) {
    try {
      const created = await dispatch(
        todoApi.endpoints.createTodo.initiate({
          ...payload,
          idempotencyKey: Crypto.randomUUID(),
        })
      ).unwrap()

      const record = serverTodoToLocalRecord(created, 'synced')
      record.localId = localId
      store = {
        ...store,
        todos: [record, ...store.todos],
        lastSyncAt: new Date().toISOString(),
      }
      await saveOfflineStore(store)
      dispatch(upsertTodoView(record))
      return todoToViewModel(record)
    } catch (error) {
      if (getErrorCode(error) !== 'NETWORK_ERROR') {
        throw error
      }
    }
  }

  const record = buildLocalRecordFromCreate(localId, normalized, 'pending')
  const queueOp = buildQueuedCreate(localId, normalized)
  store = {
    ...store,
    todos: [record, ...store.todos],
    queue: [...store.queue, queueOp],
  }
  await saveOfflineStore(store)
  dispatch(upsertTodoView(record))
  dispatch(setSyncMeta({ pendingCount: store.queue.length, lastSyncAt: store.lastSyncAt }))
  void runTodoSync(dispatch, userId)
  return todoToViewModel(record)
}

export async function updateTodoOfflineAware(
  dispatch: AppDispatch,
  userId: string,
  payload: TodoUpdatePayload
): Promise<TodoViewModel> {
  const store = await loadOfflineStore(userId)
  const record = store.todos.find(item => item.localId === payload.id || item.serverId === payload.id)

  if (!record) {
    throw new Error('Todo not found')
  }

  const updatePayload = {
    title: payload.title,
    description: payload.description,
    done: payload.done,
    dueTo: toISO(payload.dueTo),
    reminderOn: toISO(payload.reminderOn),
  }

  const updatedRecord = applyUpdateToRecord(record, updatePayload)

  if (store.localOnly) {
    updatedRecord.syncStatus = 'local_only'
    const nextStore: UserOfflineStore = {
      ...store,
      todos: store.todos.map(item => item.localId === record.localId ? updatedRecord : item),
    }
    await saveOfflineStore(nextStore)
    dispatch(upsertTodoView(updatedRecord))
    return todoToViewModel(updatedRecord)
  }

  const online = await isDeviceOnline()

  if (online && record.serverId) {
    try {
      const remote = await dispatch(
        todoApi.endpoints.updateTodo.initiate({
          id: record.serverId,
          title: payload.title,
          description: payload.description,
          done: payload.done,
          dueTo: payload.dueTo,
          reminderOn: payload.reminderOn,
        })
      ).unwrap()

      const synced = serverTodoToLocalRecord(remote, 'synced')
      synced.localId = record.localId
      const nextStore: UserOfflineStore = {
        ...store,
        todos: store.todos.map(item => item.localId === record.localId ? synced : item),
        lastSyncAt: new Date().toISOString(),
      }
      await saveOfflineStore(nextStore)
      dispatch(upsertTodoView(synced))
      return todoToViewModel(synced)
    } catch (error) {
      if (getErrorCode(error) !== 'NETWORK_ERROR') {
        throw error
      }
    }
  }

  const queueOp = buildQueuedUpdate(record.localId, record.serverId, updatePayload)
  updatedRecord.syncStatus = 'pending'
  const nextStore: UserOfflineStore = {
    ...store,
    todos: store.todos.map(item => item.localId === record.localId ? updatedRecord : item),
    queue: [...store.queue, queueOp],
  }
  await saveOfflineStore(nextStore)
  dispatch(upsertTodoView(updatedRecord))
  dispatch(setSyncMeta({ pendingCount: nextStore.queue.length, lastSyncAt: nextStore.lastSyncAt }))
  void runTodoSync(dispatch, userId)
  return todoToViewModel(updatedRecord)
}

export async function deleteTodoOfflineAware(
  dispatch: AppDispatch,
  userId: string,
  todoId: string
): Promise<boolean> {
  const store = await loadOfflineStore(userId)
  const record = store.todos.find(item => item.localId === todoId || item.serverId === todoId)

  if (!record) {
    return false
  }

  if (store.localOnly) {
    const nextStore: UserOfflineStore = {
      ...store,
      todos: store.todos.filter(item => item.localId !== record.localId),
    }
    await saveOfflineStore(nextStore)
    dispatch(removeTodoView(record.localId))
    publishStore(dispatch, nextStore)
    return true
  }

  const online = await isDeviceOnline()

  if (online && record.serverId) {
    try {
      await dispatch(todoApi.endpoints.deleteTodo.initiate(record.serverId)).unwrap()
      const nextStore: UserOfflineStore = {
        ...store,
        todos: store.todos.filter(item => item.localId !== record.localId),
        lastSyncAt: new Date().toISOString(),
      }
      await saveOfflineStore(nextStore)
      dispatch(removeTodoView(record.localId))
      publishStore(dispatch, nextStore)
      return true
    } catch (error) {
      if (getErrorCode(error) !== 'NETWORK_ERROR') {
        throw error
      }
    }
  }

  const queueOp = buildQueuedDelete(record.localId, record.serverId)
  const nextStore: UserOfflineStore = {
    ...store,
    todos: store.todos.filter(item => item.localId !== record.localId),
    queue: [...store.queue, queueOp],
  }
  await saveOfflineStore(nextStore)
  dispatch(removeTodoView(record.localId))
  dispatch(setSyncMeta({ pendingCount: nextStore.queue.length, lastSyncAt: nextStore.lastSyncAt }))
  void runTodoSync(dispatch, userId)
  return true
}

export async function enableLocalOnlyMode(
  dispatch: AppDispatch,
  userId: string
): Promise<UserOfflineStore> {
  const online = await isDeviceOnline()

  if (!online) {
    throw new Error('An internet connection is required to enable local-only mode.')
  }

  const snapshot = await fetchAllServerTodos(dispatch)
  const store = await updateOfflineStore(userId, current => ({
    ...current,
    localOnly: true,
    baselineSnapshot: snapshot,
    todos: snapshot.map(item => ({ ...item, syncStatus: 'local_only' as const })),
    queue: [],
  }))

  dispatch(setLocalOnly(true))
  publishStore(dispatch, store)
  return store
}

export async function disableLocalOnlyMode(
  dispatch: AppDispatch,
  userId: string,
  confirmed: boolean
): Promise<UserOfflineStore> {
  if (!confirmed) {
    return loadOfflineStore(userId)
  }

  const store = await loadOfflineStore(userId)
  const baseline = store.baselineSnapshot ?? []
  const queue = deriveQueueFromBaseline(baseline, store.todos)

  const nextStore: UserOfflineStore = {
    ...store,
    localOnly: false,
    baselineSnapshot: null,
    queue: [...store.queue, ...queue],
    todos: store.todos.map(item => ({
      ...item,
      syncStatus: item.syncStatus === 'local_only' ? 'pending' : item.syncStatus,
    })),
  }

  await saveOfflineStore(nextStore)
  dispatch(setLocalOnly(false))
  publishStore(dispatch, nextStore)
  void runTodoSync(dispatch, userId)
  return nextStore
}

export async function initializeTodoData(
  dispatch: AppDispatch,
  userId: string
): Promise<void> {
  await hydrateOfflineTodos(dispatch, userId)
  await refreshTodosFromServer(dispatch, userId)
}

export function paginateLocalTodos(
  todos: TodoViewModel[],
  pagination?: TodoPaginationInput
): PaginatedTodos {
  const currentPage = pagination?.currentPage ?? 1
  const limit = pagination?.limit ?? 10
  const start = (currentPage - 1) * limit
  const slice = todos.slice(start, start + limit)
  const total = todos.length
  const last = Math.max(1, Math.ceil(total / limit))

  return {
    data: slice.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      done: item.done,
      dueTo: item.dueTo,
      reminderOn: item.reminderOn,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    first: total === 0 ? 0 : start + 1,
    last,
    limit,
    total,
  }
}
