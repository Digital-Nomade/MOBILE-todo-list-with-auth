import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  LocalTodoRecord,
  QueuedOperation,
  UserOfflineStore,
} from '@/types/todo-types'
import { compactQueue } from './mappers'
import { offlineStoreKey } from './keys'

let writeChain: Promise<void> = Promise.resolve()

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = writeChain.then(task, task)
  writeChain = next.then(() => undefined, () => undefined)
  return next
}

function emptyStore(userId: string): UserOfflineStore {
  return {
    version: 1,
    userId,
    localOnly: false,
    baselineSnapshot: null,
    todos: [],
    queue: [],
    lastSyncAt: null,
  }
}

function isLocalTodoRecord(value: unknown): value is LocalTodoRecord {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Partial<LocalTodoRecord>
  return (
    typeof record.localId === 'string' &&
    (record.serverId === null || typeof record.serverId === 'string') &&
    typeof record.title === 'string' &&
    typeof record.description === 'string' &&
    typeof record.done === 'boolean' &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string' &&
    typeof record.syncStatus === 'string'
  )
}

function isQueuedOperation(value: unknown): value is QueuedOperation {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const op = value as Partial<QueuedOperation>
  return (
    typeof op.opId === 'string' &&
    typeof op.localId === 'string' &&
    typeof op.createdAt === 'string' &&
    typeof op.retryCount === 'number' &&
    (op.type === 'CREATE' || op.type === 'UPDATE' || op.type === 'DELETE')
  )
}

function parseStore(raw: string | null, userId: string): UserOfflineStore {
  if (!raw) {
    return emptyStore(userId)
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserOfflineStore>

    if (parsed.version !== 1 || parsed.userId !== userId) {
      return emptyStore(userId)
    }

    const todos = Array.isArray(parsed.todos)
      ? parsed.todos.filter(isLocalTodoRecord)
      : []

    const queue = Array.isArray(parsed.queue)
      ? compactQueue(parsed.queue.filter(isQueuedOperation))
      : []

    return {
      version: 1,
      userId,
      localOnly: Boolean(parsed.localOnly),
      baselineSnapshot: Array.isArray(parsed.baselineSnapshot)
        ? parsed.baselineSnapshot.filter(isLocalTodoRecord)
        : null,
      todos,
      queue,
      lastSyncAt: typeof parsed.lastSyncAt === 'string' ? parsed.lastSyncAt : null,
    }
  } catch {
    return emptyStore(userId)
  }
}

async function readStore(userId: string): Promise<UserOfflineStore> {
  const raw = await AsyncStorage.getItem(offlineStoreKey(userId))
  return parseStore(raw, userId)
}

async function writeStore(store: UserOfflineStore): Promise<void> {
  const normalized: UserOfflineStore = {
    ...store,
    queue: compactQueue(store.queue),
  }

  await AsyncStorage.setItem(offlineStoreKey(store.userId), JSON.stringify(normalized))
}

export async function loadOfflineStore(userId: string): Promise<UserOfflineStore> {
  return readStore(userId)
}

export async function saveOfflineStore(store: UserOfflineStore): Promise<void> {
  return runExclusive(async () => {
    await writeStore(store)
  })
}

export async function updateOfflineStore(
  userId: string,
  updater: (current: UserOfflineStore) => UserOfflineStore
): Promise<UserOfflineStore> {
  return runExclusive(async () => {
    const current = await readStore(userId)
    const next = updater(current)
    await writeStore(next)
    return next
  })
}

export async function clearOfflineStore(userId: string): Promise<void> {
  return runExclusive(async () => {
    await AsyncStorage.removeItem(offlineStoreKey(userId))
  })
}

export function createEmptyOfflineStore(userId: string): UserOfflineStore {
  return emptyStore(userId)
}
