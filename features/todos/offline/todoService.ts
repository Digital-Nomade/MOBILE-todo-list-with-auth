import { getErrorCode } from '@/config/graphql/errors'
import { AppDispatch } from '@/config/redux/store'
import {
  LocalTodoRecord,
  PaginatedTodos,
  PreparedTodoLocalOnlyMigration,
  TodoCreationPayload,
  TodoPaginationInput,
  TodoUpdatePayload,
  TodoViewModel,
  UserOfflineStore,
} from '@/types/todo-types'
import * as Crypto from 'expo-crypto'
import NetInfo from '@react-native-community/netinfo'
import { todoApi } from '../todoApi'
import { applyTodoChangedEventToStore } from '../applyTodoChangedEvent'
import { TodoChangedEvent } from '../todoSubscription'
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
  incrementSearchRefreshTick,
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
  total: true,
  orderBy: 'DESC',
}

async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return Boolean(state.isConnected && state.isInternetReachable !== false)
}

let serverRefreshChain: Promise<unknown> = Promise.resolve()

function runExclusiveServerRefresh<T>(task: () => Promise<T>): Promise<T> {
  const next = serverRefreshChain.then(task, task)
  serverRefreshChain = next.then(() => undefined, () => undefined)
  return next
}

async function fetchAllServerTodos(dispatch: AppDispatch): Promise<LocalTodoRecord[]> {
  const records: LocalTodoRecord[] = []
  let currentPage = 1
  let hasMore = true

  while (hasMore) {
    const page = await dispatch(
      todoApi.endpoints.fetchTodos.initiate(
        { ...DEFAULT_PAGINATION, currentPage },
        { forceRefetch: true, subscribe: false },
      )
    ).unwrap()

    if (!page?.data) {
      break
    }

    records.push(...page.data.map(todo => serverTodoToLocalRecord(todo)))
    hasMore = page.total != null
      ? records.length < page.total
      : page.data.length === DEFAULT_PAGINATION.limit
    currentPage += 1
  }

  return records
}

export async function calculateTodoMigrationChecksum(
  snapshot: Pick<PreparedTodoLocalOnlyMigration, 'todos'>,
): Promise<string> {
  const payload = [...snapshot.todos]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(todo => `${todo.id}:${todo.updatedAt}`)
    .join('|')

  return (
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload)
  ).toLowerCase()
}

async function verifyMigrationSnapshot(
  snapshot: PreparedTodoLocalOnlyMigration,
): Promise<void> {
  if (snapshot.todoCount !== snapshot.todos.length) {
    throw new Error('The server todo snapshot is incomplete.')
  }

  const checksum = await calculateTodoMigrationChecksum(snapshot)

  if (checksum !== snapshot.checksum.toLowerCase()) {
    throw new Error('The server todo snapshot checksum does not match.')
  }
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

  const page = await dispatch(
    todoApi.endpoints.searchTodos.initiate({
      term: normalized,
      ...DEFAULT_PAGINATION,
      limit: 50,
    }, { subscribe: false }),
  ).unwrap()

  return (page?.data ?? []).map(todo => todoToViewModel(serverTodoToLocalRecord(todo)))
}

export async function refreshTodosFromServer(
  dispatch: AppDispatch,
  userId: string
): Promise<TodoViewModel[]> {
  return runExclusiveServerRefresh(async () => {
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
  })
}

/**
 * Applies a live subscription event, refetches todos from the server, and
 * invalidates list/search caches so open screens reconcile.
 */
export async function reconcileAfterTodoChanged(
  dispatch: AppDispatch,
  userId: string,
  event?: TodoChangedEvent,
): Promise<void> {
  if (event) {
    const nextStore = await updateOfflineStore(userId, store =>
      applyTodoChangedEventToStore(store, event),
    )
    publishStore(dispatch, nextStore)
  }

  try {
    await refreshTodosFromServer(dispatch, userId)
  } catch (error) {
    // Incremental subscription updates may already be visible; keep going.
    if (!event) {
      throw error
    }
  }

  dispatch(incrementSearchRefreshTick())
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
      const serverIndex = merged.findIndex(item => item.serverId === local.serverId)

      if (serverIndex >= 0) {
        // A pull must never roll back a queued local edit. The local record
        // stays authoritative until its operation has synced.
        merged[serverIndex] = local
      }
      continue
    }

    if (!merged.some(item => item.localId === local.localId)) {
      merged.unshift(local)
    }
  }

  return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
    const remote = await dispatch(
      todoApi.endpoints.fetchTodo.initiate(todoId, { subscribe: false }),
    ).unwrap()
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

  let current = await loadOfflineStore(userId)

  if (current.localOnly) {
    return resumeLocalOnlyMigration(dispatch, userId)
  }

  if (current.queue.length > 0) {
    await runTodoSync(dispatch, userId)
    current = await loadOfflineStore(userId)
  }

  if (current.queue.length > 0) {
    throw new Error('Pending todo changes must finish syncing before local-only mode can be enabled.')
  }

  const prepared = await dispatch(
    todoApi.endpoints.prepareLocalOnlyMigration.initiate(),
  ).unwrap()

  try {
    await verifyMigrationSnapshot(prepared)
  } catch (error) {
    await dispatch(
      todoApi.endpoints.cancelLocalOnlyMigration.initiate(prepared.migrationId),
    ).unwrap().catch(() => undefined)
    throw error
  }

  const snapshot = prepared.todos.map(todo => ({
    ...serverTodoToLocalRecord(todo),
    syncStatus: 'local_only' as const,
  }))

  let store: UserOfflineStore

  try {
    store = await updateOfflineStore(userId, latest => {
      if (latest.queue.length > 0) {
        throw new Error('Todo changes started while local-only mode was being prepared. Please try again.')
      }

      return {
        ...latest,
        localOnly: true,
        localOnlyMigration: {
          migrationId: prepared.migrationId,
          expiresAt: prepared.expiresAt,
          checksum: prepared.checksum,
        },
        baselineSnapshot: snapshot,
        todos: snapshot,
        queue: [],
      }
    })
  } catch (error) {
    await dispatch(
      todoApi.endpoints.cancelLocalOnlyMigration.initiate(prepared.migrationId),
    ).unwrap().catch(() => undefined)
    throw error
  }

  dispatch(setLocalOnly(true))
  publishStore(dispatch, store)

  try {
    return await commitDurableLocalOnlyMigration(dispatch, userId, prepared.migrationId)
  } catch (error) {
    const code = getErrorCode(error)

    if (
      code === 'NETWORK_ERROR' ||
      code === 'INTERNAL_SERVER_ERROR' ||
      code === 'TOO_MANY_REQUESTS'
    ) {
      // The verified local snapshot is already durable. Keep the migration ID
      // so startup/reconnect can safely retry the idempotent commit.
      return loadOfflineStore(userId)
    }

    if (code === 'MIGRATION_EXPIRED' || code === 'MIGRATION_NOT_FOUND') {
      return resumeLocalOnlyMigration(dispatch, userId)
    }

    throw error
  }
}

async function commitDurableLocalOnlyMigration(
  dispatch: AppDispatch,
  userId: string,
  migrationId: string,
): Promise<UserOfflineStore> {
  await dispatch(
    todoApi.endpoints.commitLocalOnlyMigration.initiate(migrationId),
  ).unwrap()

  const committed = await updateOfflineStore(userId, current => ({
    ...current,
    localOnly: true,
    localOnlyMigration: null,
    // The prepared server rows have been deleted. If local-only mode is later
    // disabled, every remaining local record must be recreated.
    baselineSnapshot: [],
    todos: current.todos.map(todo => ({
      ...todo,
      serverId: null,
      syncStatus: 'local_only' as const,
    })),
  }))

  publishStore(dispatch, committed)
  return committed
}

export async function resumeLocalOnlyMigration(
  dispatch: AppDispatch,
  userId: string,
): Promise<UserOfflineStore> {
  let store = await loadOfflineStore(userId)
  const pending = store.localOnlyMigration

  if (!store.localOnly || !pending) {
    return store
  }

  try {
    return await commitDurableLocalOnlyMigration(dispatch, userId, pending.migrationId)
  } catch (error) {
    const code = getErrorCode(error)

    if (code !== 'MIGRATION_EXPIRED' && code !== 'MIGRATION_NOT_FOUND') {
      throw error
    }
  }

  // The old prepare no longer protects its rows. Prepare again and durably
  // merge any server todos created meanwhile before deleting the new snapshot.
  const prepared = await dispatch(
    todoApi.endpoints.prepareLocalOnlyMigration.initiate(),
  ).unwrap()
  await verifyMigrationSnapshot(prepared)

  const currentByServerId = new Set(
    store.todos.map(todo => todo.serverId).filter((id): id is string => Boolean(id)),
  )
  const missing = prepared.todos
    .filter(todo => !currentByServerId.has(todo.id))
    .map(todo => ({
      ...serverTodoToLocalRecord(todo),
      syncStatus: 'local_only' as const,
    }))

  store = await updateOfflineStore(userId, current => ({
    ...current,
    todos: [...missing, ...current.todos],
    localOnlyMigration: {
      migrationId: prepared.migrationId,
      expiresAt: prepared.expiresAt,
      checksum: prepared.checksum,
    },
  }))
  publishStore(dispatch, store)

  return commitDurableLocalOnlyMigration(dispatch, userId, prepared.migrationId)
}

export async function disableLocalOnlyMode(
  dispatch: AppDispatch,
  userId: string,
  confirmed: boolean
): Promise<UserOfflineStore> {
  if (!confirmed) {
    return loadOfflineStore(userId)
  }

  let store = await loadOfflineStore(userId)

  if (store.localOnlyMigration) {
    store = await resumeLocalOnlyMigration(dispatch, userId)
  }

  const baseline = store.baselineSnapshot ?? []
  const queue = deriveQueueFromBaseline(baseline, store.todos)

  const nextStore: UserOfflineStore = {
    ...store,
    localOnly: false,
    localOnlyMigration: null,
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
  const store = await hydrateOfflineTodos(dispatch, userId)

  if (store.localOnlyMigration && await isDeviceOnline()) {
    await resumeLocalOnlyMigration(dispatch, userId).catch(() => undefined)
  }

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
  const last = total === 0 ? 0 : start + slice.length

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
