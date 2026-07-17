import { getErrorCode, NormalizedGraphQLError } from '@/config/graphql/errors'
import { AppDispatch } from '@/config/redux/store'
import {
  LocalTodoRecord,
  QueuedOperation,
  UserOfflineStore,
} from '@/types/todo-types'
import * as Crypto from 'expo-crypto'
import { todoApi } from '../todoApi'
import { applyUpdateToRecord, serverTodoToLocalRecord, toISO } from './mappers'
import { loadOfflineStore, saveOfflineStore } from './repository'
import {
  setCoordinatorStatus,
  setHydratedTodos,
  setSyncMeta,
  upsertTodoView,
} from './offlineSlice'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 500

const syncLocks = new Map<string, Promise<void>>()

function isRetryable(code: string): boolean {
  return code === 'NETWORK_ERROR' || code === 'INTERNAL_SERVER_ERROR' || code === 'TOO_MANY_REQUESTS'
}

function backoffMs(retryCount: number): number {
  const jitter = Math.floor(Math.random() * 200)
  return BASE_DELAY_MS * 2 ** retryCount + jitter
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

function hydrateDispatch(dispatch: AppDispatch, store: UserOfflineStore): void {
  dispatch(setHydratedTodos({
    records: store.todos,
    localOnly: store.localOnly,
    pendingCount: store.queue.length,
    lastSyncAt: store.lastSyncAt,
  }))
}

async function executeCreate(
  dispatch: AppDispatch,
  store: UserOfflineStore,
  op: Extract<QueuedOperation, { type: 'CREATE' }>
): Promise<{ store: UserOfflineStore; stop: boolean }> {
  try {
    const created = await dispatch(
      todoApi.endpoints.createTodo.initiate({
        title: op.payload.title,
        description: op.payload.description,
        dueTo: op.payload.dueTo ? new Date(op.payload.dueTo) : undefined,
        reminderOn: op.payload.reminderOn ? new Date(op.payload.reminderOn) : undefined,
        idempotencyKey: op.idempotencyKey,
      })
    ).unwrap()

    const syncedRecord = serverTodoToLocalRecord(created, 'synced')
    syncedRecord.localId = op.localId

    const todos = store.todos.map(item =>
      item.localId === op.localId ? syncedRecord : item
    )

    const queue = store.queue.filter(item => item.opId !== op.opId)

    return {
      store: { ...store, todos, queue },
      stop: false,
    }
  } catch (error) {
    const code = getErrorCode(error)

    if (code === 'UNAUTHENTICATED') {
      return { store, stop: true }
    }

    if (!isRetryable(code)) {
      const todos = store.todos.map(item =>
        item.localId === op.localId ? { ...item, syncStatus: 'failed' as const } : item
      )
      const queue = store.queue.filter(item => item.opId !== op.opId)
      return { store: { ...store, todos, queue }, stop: false }
    }

    const queue = store.queue.map(item =>
      item.opId === op.opId
        ? {
            ...item,
            retryCount: item.retryCount + 1,
            lastError: (error as NormalizedGraphQLError).message,
          }
        : item
    )

    const updatedOp = queue.find(item => item.opId === op.opId)

    if ((updatedOp?.retryCount ?? 0) >= MAX_RETRIES) {
      const todos = store.todos.map(item =>
        item.localId === op.localId ? { ...item, syncStatus: 'failed' as const } : item
      )
      return {
        store: {
          ...store,
          todos,
          queue: queue.filter(item => item.opId !== op.opId),
        },
        stop: false,
      }
    }

    await sleep(backoffMs(op.retryCount))
    return { store: { ...store, queue }, stop: true }
  }
}

async function executeUpdate(
  dispatch: AppDispatch,
  store: UserOfflineStore,
  op: Extract<QueuedOperation, { type: 'UPDATE' }>
): Promise<{ store: UserOfflineStore; stop: boolean }> {
  const record = store.todos.find(item => item.localId === op.localId)
  const serverId = op.serverId ?? record?.serverId

  if (!serverId) {
    return { store, stop: false }
  }

  try {
    const updated = await dispatch(
      todoApi.endpoints.updateTodo.initiate({
        id: serverId,
        ...op.payload,
        dueTo: op.payload.dueTo ?? undefined,
        reminderOn: op.payload.reminderOn ?? undefined,
      })
    ).unwrap()

    const syncedRecord = serverTodoToLocalRecord(updated, 'synced')
    syncedRecord.localId = op.localId

    const todos = store.todos.map(item =>
      item.localId === op.localId ? syncedRecord : item
    )
    const queue = store.queue.filter(item => item.opId !== op.opId)

    return { store: { ...store, todos, queue }, stop: false }
  } catch (error) {
    const code = getErrorCode(error)

    if (code === 'UNAUTHENTICATED') {
      return { store, stop: true }
    }

    if (!isRetryable(code)) {
      const todos = store.todos.map(item =>
        item.localId === op.localId ? { ...item, syncStatus: 'failed' as const } : item
      )
      const queue = store.queue.filter(item => item.opId !== op.opId)
      return { store: { ...store, todos, queue }, stop: false }
    }

    await sleep(backoffMs(op.retryCount))
    return { store, stop: true }
  }
}

async function executeDelete(
  dispatch: AppDispatch,
  store: UserOfflineStore,
  op: Extract<QueuedOperation, { type: 'DELETE' }>
): Promise<{ store: UserOfflineStore; stop: boolean }> {
  const record = store.todos.find(item => item.localId === op.localId)
  const serverId = op.serverId ?? record?.serverId

  if (!serverId) {
    const todos = store.todos.filter(item => item.localId !== op.localId)
    const queue = store.queue.filter(item => item.opId !== op.opId)
    return { store: { ...store, todos, queue }, stop: false }
  }

  try {
    await dispatch(todoApi.endpoints.deleteTodo.initiate(serverId)).unwrap()

    const todos = store.todos.filter(item => item.localId !== op.localId)
    const queue = store.queue.filter(item => item.opId !== op.opId)

    return { store: { ...store, todos, queue }, stop: false }
  } catch (error) {
    const code = getErrorCode(error)

    if (code === 'UNAUTHENTICATED') {
      return { store, stop: true }
    }

    if (!isRetryable(code)) {
      const queue = store.queue.filter(item => item.opId !== op.opId)
      return { store: { ...store, queue }, stop: false }
    }

    await sleep(backoffMs(op.retryCount))
    return { store, stop: true }
  }
}

async function processQueue(dispatch: AppDispatch, userId: string): Promise<UserOfflineStore> {
  let store = await loadOfflineStore(userId)

  if (store.localOnly || store.queue.length === 0) {
    return store
  }

  dispatch(setCoordinatorStatus({ status: 'syncing', error: null }))

  for (const op of [...store.queue]) {
    let result: { store: UserOfflineStore; stop: boolean }

    switch (op.type) {
      case 'CREATE':
        result = await executeCreate(dispatch, store, op)
        break
      case 'UPDATE':
        result = await executeUpdate(dispatch, store, op)
        break
      case 'DELETE':
        result = await executeDelete(dispatch, store, op)
        break
      default:
        result = { store, stop: false }
    }

    store = result.store
    await saveOfflineStore(store)
    hydrateDispatch(dispatch, store)

    const affected = store.todos.find(item => item.localId === op.localId)
    if (affected) {
      dispatch(upsertTodoView(affected))
    }

    if (result.stop) {
      break
    }
  }

  store = {
    ...store,
    lastSyncAt: new Date().toISOString(),
  }
  await saveOfflineStore(store)

  dispatch(setSyncMeta({ pendingCount: store.queue.length, lastSyncAt: store.lastSyncAt }))
  dispatch(setCoordinatorStatus({
    status: store.queue.length > 0 ? 'failed' : 'idle',
    error: store.queue.length > 0 ? 'Some changes could not be synced yet.' : null,
  }))

  return store
}

export async function runTodoSync(dispatch: AppDispatch, userId: string): Promise<void> {
  const existing = syncLocks.get(userId)

  if (existing) {
    return existing
  }

  const task = (async () => {
    try {
      await processQueue(dispatch, userId)
    } finally {
      syncLocks.delete(userId)
    }
  })()

  syncLocks.set(userId, task)
  return task
}

export async function hydrateOfflineTodos(dispatch: AppDispatch, userId: string): Promise<UserOfflineStore> {
  const store = await loadOfflineStore(userId)
  hydrateDispatch(dispatch, store)
  return store
}

export function buildLocalRecordFromCreate(
  localId: string,
  payload: { title: string; description: string; dueTo?: string | null; reminderOn?: string | null },
  syncStatus: LocalTodoRecord['syncStatus']
): LocalTodoRecord {
  const now = new Date().toISOString()
  return {
    localId,
    serverId: null,
    title: payload.title,
    description: payload.description,
    done: false,
    dueTo: payload.dueTo ?? null,
    reminderOn: payload.reminderOn ?? null,
    createdAt: now,
    updatedAt: now,
    syncStatus,
  }
}

export function buildQueuedCreate(
  localId: string,
  payload: { title: string; description: string; dueTo?: string | null; reminderOn?: string | null }
): Extract<QueuedOperation, { type: 'CREATE' }> {
  return {
    opId: Crypto.randomUUID(),
    type: 'CREATE',
    localId,
    idempotencyKey: Crypto.randomUUID(),
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }
}

export function buildQueuedUpdate(
  localId: string,
  serverId: string | null,
  payload: Extract<QueuedOperation, { type: 'UPDATE' }>['payload']
): Extract<QueuedOperation, { type: 'UPDATE' }> {
  return {
    opId: Crypto.randomUUID(),
    type: 'UPDATE',
    localId,
    serverId,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }
}

export function buildQueuedDelete(
  localId: string,
  serverId: string | null
): Extract<QueuedOperation, { type: 'DELETE' }> {
  return {
    opId: Crypto.randomUUID(),
    type: 'DELETE',
    localId,
    serverId,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }
}

export function deriveQueueFromBaseline(
  baseline: LocalTodoRecord[],
  current: LocalTodoRecord[]
): QueuedOperation[] {
  const baselineByLocalId = new Map(baseline.map(item => [item.localId, item]))
  const currentByLocalId = new Map(current.map(item => [item.localId, item]))
  const queue: QueuedOperation[] = []

  for (const record of current) {
    const previous = baselineByLocalId.get(record.localId)

    if (!previous) {
      queue.push(buildQueuedCreate(record.localId, {
        title: record.title,
        description: record.description,
        dueTo: record.dueTo,
        reminderOn: record.reminderOn,
      }))
      continue
    }

    const changed =
      previous.title !== record.title ||
      previous.description !== record.description ||
      previous.done !== record.done ||
      previous.dueTo !== record.dueTo ||
      previous.reminderOn !== record.reminderOn

    if (changed) {
      queue.push(buildQueuedUpdate(record.localId, record.serverId, {
        title: record.title,
        description: record.description,
        done: record.done,
        dueTo: record.dueTo,
        reminderOn: record.reminderOn,
      }))
    }
  }

  for (const record of baseline) {
    if (!currentByLocalId.has(record.localId)) {
      queue.push(buildQueuedDelete(record.localId, record.serverId))
    }
  }

  return queue
}

export { applyUpdateToRecord, toISO }
