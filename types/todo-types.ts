/** Backend Todo. IDs are UUID strings; DateTime fields are ISO-8601 strings. */
export interface Todo {
  id: string
  title: string
  description: string
  done: boolean
  dueTo?: string | null
  reminderOn?: string | null
  createdAt: string
  updatedAt: string
}

export type TodoOrder = 'ASC' | 'DESC'

export interface TodoPaginationInput {
  currentPage?: number
  limit?: number
  orderBy?: TodoOrder
  total?: boolean
}

export interface PaginatedTodos {
  data: Todo[]
  first: number
  last: number
  limit: number
  total?: number | null
}

export interface PreparedTodoLocalOnlyMigration {
  migrationId: string
  expiresAt: string
  todoCount: number
  checksum: string
  todos: Todo[]
}

export interface CommittedTodoLocalOnlyMigration {
  migrationId: string
  deletedCount: number
  committedAt: string
}

export interface LocalOnlyMigrationState {
  migrationId: string
  expiresAt: string
  checksum: string
}

export interface TodoCreationPayload {
  title: string
  description: string
  dueTo?: Date
  reminderOn?: Date
}

export interface TodoUpdatePayload {
  id: string
  title?: string
  description?: string
  done?: boolean
  dueTo?: Date | string | null
  reminderOn?: Date | string | null
}

/** Sync lifecycle for a locally tracked todo record. */
export type TodoSyncStatus = 'synced' | 'pending' | 'local_only' | 'failed'

/** Durable local record keyed by stable localId; serverId is set after upload. */
export interface LocalTodoRecord {
  localId: string
  serverId: string | null
  title: string
  description: string
  done: boolean
  dueTo?: string | null
  reminderOn?: string | null
  createdAt: string
  updatedAt: string
  syncStatus: TodoSyncStatus
}

export type QueuedOperationType = 'CREATE' | 'UPDATE' | 'DELETE'

export interface QueuedOperationBase {
  opId: string
  localId: string
  createdAt: string
  retryCount: number
  lastError?: string
}

export interface QueuedCreateOperation extends QueuedOperationBase {
  type: 'CREATE'
  idempotencyKey: string
  payload: {
    title: string
    description: string
    done?: boolean
    dueTo?: string | null
    reminderOn?: string | null
  }
}

export interface QueuedUpdateOperation extends QueuedOperationBase {
  type: 'UPDATE'
  serverId: string | null
  payload: {
    title?: string
    description?: string
    done?: boolean
    dueTo?: string | null
    reminderOn?: string | null
  }
}

export interface QueuedDeleteOperation extends QueuedOperationBase {
  type: 'DELETE'
  serverId: string | null
}

export type QueuedOperation =
  | QueuedCreateOperation
  | QueuedUpdateOperation
  | QueuedDeleteOperation

/** Per-user offline store persisted in AsyncStorage. */
export interface UserOfflineStore {
  version: 1
  userId: string
  localOnly: boolean
  /** Present after the local snapshot is durable but before server deletion is confirmed. */
  localOnlyMigration: LocalOnlyMigrationState | null
  baselineSnapshot: LocalTodoRecord[] | null
  todos: LocalTodoRecord[]
  queue: QueuedOperation[]
  lastSyncAt: string | null
}

export type SyncCoordinatorStatus = 'idle' | 'syncing' | 'failed'

export interface TodoSyncState {
  isOnline: boolean
  localOnly: boolean
  pendingCount: number
  coordinatorStatus: SyncCoordinatorStatus
  lastSyncAt: string | null
  lastError: string | null
}

/** View-model todo exposed to UI (uses localId as primary id). */
export interface TodoViewModel extends Omit<Todo, 'id'> {
  id: string
  localId: string
  serverId: string | null
  syncStatus: TodoSyncStatus
}
