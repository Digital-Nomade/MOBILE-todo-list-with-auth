import { compactQueue } from '../mappers'
import { QueuedOperation } from '@/types/todo-types'

describe('compactQueue', () => {
  it('drops create followed by delete for the same local todo', () => {
    const queue: QueuedOperation[] = [
      {
        opId: '1',
        type: 'CREATE',
        localId: 'local-1',
        idempotencyKey: 'key-1',
        payload: { title: 'A', description: '' },
        createdAt: '2026-01-01T00:00:00.000Z',
        retryCount: 0,
      },
      {
        opId: '2',
        type: 'DELETE',
        localId: 'local-1',
        serverId: null,
        createdAt: '2026-01-01T00:00:01.000Z',
        retryCount: 0,
      },
    ]

    expect(compactQueue(queue)).toEqual([])
  })

  it('merges repeated updates into a single update operation', () => {
    const queue: QueuedOperation[] = [
      {
        opId: '1',
        type: 'UPDATE',
        localId: 'local-1',
        serverId: 'server-1',
        payload: { title: 'A' },
        createdAt: '2026-01-01T00:00:00.000Z',
        retryCount: 0,
      },
      {
        opId: '2',
        type: 'UPDATE',
        localId: 'local-1',
        serverId: 'server-1',
        payload: { done: true },
        createdAt: '2026-01-01T00:00:01.000Z',
        retryCount: 0,
      },
    ]

    const compacted = compactQueue(queue)
    expect(compacted).toHaveLength(1)
    expect(compacted[0]).toMatchObject({
      type: 'UPDATE',
      payload: { title: 'A', done: true },
    })
  })
})
