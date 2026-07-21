import { applyTodoChangedEventToStore } from '@/features/todos/applyTodoChangedEvent'
import { UserOfflineStore } from '@/types/todo-types'

const USER_ID = 'user-1'

function createStore(todos: UserOfflineStore['todos']): UserOfflineStore {
  return {
    version: 1,
    userId: USER_ID,
    localOnly: false,
    localOnlyMigration: null,
    baselineSnapshot: null,
    todos,
    queue: [],
    lastSyncAt: null,
  }
}

describe('applyTodoChangedEventToStore', () => {
  it('removes deleted todos by server id', () => {
    const store = createStore([
      {
        localId: 'todo-1',
        serverId: 'todo-1',
        title: 'Buy milk',
        description: '',
        done: false,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T10:00:00.000Z',
        syncStatus: 'synced',
      },
    ])

    const next = applyTodoChangedEventToStore(store, {
      type: 'DELETED',
      todoId: 'todo-1',
      occurredAt: '2026-07-20T11:00:00.000Z',
      todo: null,
    })

    expect(next.todos).toEqual([])
  })

  it('upserts created and updated todos from the server payload', () => {
    const store = createStore([])

    const created = applyTodoChangedEventToStore(store, {
      type: 'CREATED',
      todoId: 'todo-1',
      occurredAt: '2026-07-20T11:00:00.000Z',
      todo: {
        id: 'todo-1',
        title: 'Buy milk',
        description: '2%',
        done: false,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T10:00:00.000Z',
      },
    })

    expect(created.todos).toHaveLength(1)
    expect(created.todos[0].title).toBe('Buy milk')

    const updated = applyTodoChangedEventToStore(created, {
      type: 'UPDATED',
      todoId: 'todo-1',
      occurredAt: '2026-07-20T12:00:00.000Z',
      todo: {
        id: 'todo-1',
        title: 'Buy oat milk',
        description: '2%',
        done: true,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T12:00:00.000Z',
      },
    })

    expect(updated.todos[0].title).toBe('Buy oat milk')
    expect(updated.todos[0].done).toBe(true)
  })

  it('does not overwrite todos with pending local edits', () => {
    const store = createStore([
      {
        localId: 'local-1',
        serverId: 'todo-1',
        title: 'Local edit',
        description: '',
        done: false,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T10:00:00.000Z',
        syncStatus: 'pending',
      },
    ])

    const next = applyTodoChangedEventToStore(store, {
      type: 'UPDATED',
      todoId: 'todo-1',
      occurredAt: '2026-07-20T12:00:00.000Z',
      todo: {
        id: 'todo-1',
        title: 'Server edit',
        description: '',
        done: false,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T12:00:00.000Z',
      },
    })

    expect(next.todos[0].title).toBe('Local edit')
  })
})
