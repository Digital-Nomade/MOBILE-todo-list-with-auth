import AsyncStorage from '@react-native-async-storage/async-storage'
import { loadOfflineStore, saveOfflineStore, updateOfflineStore } from '../repository'
import { offlineStoreKey } from '../keys'

const USER_ID = 'user-1'

describe('offline repository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('returns an empty store for unknown users', async () => {
    const store = await loadOfflineStore(USER_ID)

    expect(store.userId).toBe(USER_ID)
    expect(store.todos).toEqual([])
    expect(store.queue).toEqual([])
    expect(store.localOnly).toBe(false)
  })

  it('persists and reloads user-scoped data', async () => {
    const initial = await loadOfflineStore(USER_ID)
    initial.todos.push({
      localId: 'local-1',
      serverId: null,
      title: 'Offline todo',
      description: '',
      done: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      syncStatus: 'pending',
    })

    await saveOfflineStore(initial)
    const reloaded = await loadOfflineStore(USER_ID)

    expect(reloaded.todos).toHaveLength(1)
    expect(reloaded.todos[0].title).toBe('Offline todo')
  })

  it('isolates data by authenticated user id', async () => {
    await updateOfflineStore('user-a', current => ({
      ...current,
      localOnly: true,
    }))

    const userB = await loadOfflineStore('user-b')
    expect(userB.localOnly).toBe(false)

    const raw = await AsyncStorage.getItem(offlineStoreKey('user-a'))
    expect(raw).toContain('"localOnly":true')
  })
})
