import {
  LocalTodoRecord,
  QueuedCreateOperation,
  QueuedOperation,
  QueuedUpdateOperation,
  Todo,
  TodoViewModel,
} from '@/types/todo-types'

export function todoToViewModel(record: LocalTodoRecord): TodoViewModel {
  return {
    id: record.localId,
    localId: record.localId,
    serverId: record.serverId,
    title: record.title,
    description: record.description,
    done: record.done,
    dueTo: record.dueTo,
    reminderOn: record.reminderOn,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    syncStatus: record.syncStatus,
  }
}

export function serverTodoToLocalRecord(todo: Todo, syncStatus: LocalTodoRecord['syncStatus'] = 'synced'): LocalTodoRecord {
  return {
    localId: todo.id,
    serverId: todo.id,
    title: todo.title,
    description: todo.description,
    done: todo.done,
    dueTo: todo.dueTo,
    reminderOn: todo.reminderOn,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
    syncStatus,
  }
}

export function mergeUpdateIntoCreate(
  create: QueuedCreateOperation,
  update: QueuedUpdateOperation
): QueuedCreateOperation {
  return {
    ...create,
    payload: {
      ...create.payload,
      ...(update.payload.title !== undefined ? { title: update.payload.title } : {}),
      ...(update.payload.description !== undefined ? { description: update.payload.description } : {}),
      ...(update.payload.dueTo !== undefined ? { dueTo: update.payload.dueTo } : {}),
      ...(update.payload.reminderOn !== undefined ? { reminderOn: update.payload.reminderOn } : {}),
    },
  }
}

export function mergeUpdatePayload(
  existing: QueuedUpdateOperation['payload'],
  incoming: QueuedUpdateOperation['payload']
): QueuedUpdateOperation['payload'] {
  return {
    ...existing,
    ...incoming,
  }
}

export function applyUpdateToRecord(record: LocalTodoRecord, payload: QueuedUpdateOperation['payload']): LocalTodoRecord {
  return {
    ...record,
    title: payload.title ?? record.title,
    description: payload.description ?? record.description,
    done: payload.done ?? record.done,
    dueTo: payload.dueTo !== undefined ? payload.dueTo : record.dueTo,
    reminderOn: payload.reminderOn !== undefined ? payload.reminderOn : record.reminderOn,
    updatedAt: new Date().toISOString(),
    syncStatus: record.syncStatus === 'local_only' ? 'local_only' : 'pending',
  }
}

export function compactQueue(queue: QueuedOperation[]): QueuedOperation[] {
  const byLocalId = new Map<string, QueuedOperation[]>()

  for (const op of queue) {
    const existing = byLocalId.get(op.localId) ?? []
    existing.push(op)
    byLocalId.set(op.localId, existing)
  }

  const compacted: QueuedOperation[] = []

  for (const [, ops] of byLocalId) {
    let current: QueuedOperation | null = null

    for (const op of ops) {
      if (op.type === 'CREATE') {
        current = op
        continue
      }

      if (op.type === 'DELETE') {
        if (current?.type === 'CREATE') {
          current = null
        } else {
          current = op
        }
        continue
      }

      if (op.type === 'UPDATE') {
        if (current?.type === 'CREATE') {
          current = mergeUpdateIntoCreate(current, op)
        } else if (current?.type === 'UPDATE') {
          const updateCurrent: QueuedUpdateOperation = current
          current = {
            ...updateCurrent,
            payload: mergeUpdatePayload(updateCurrent.payload, op.payload),
          }
        } else {
          current = op
        }
      }
    }

    if (current) {
      compacted.push(current)
    }
  }

  return compacted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function toISO(value: Date | string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) {
    return value
  }

  return value instanceof Date ? value.toISOString() : value
}
