import 'react-native-gesture-handler/jestSetup'

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}))

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = new Map<string, string>()

  return {
    setItem: jest.fn(async (key: string, value: string) => {
      storage.set(key, value)
    }),
    getItem: jest.fn(async (key: string) => storage.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      storage.delete(key)
    }),
    clear: jest.fn(async () => {
      storage.clear()
    }),
    __storage: storage,
  }
})

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).slice(2, 10)}`),
}))

// In-memory stand-in for the native Keychain/Keystore during tests.
jest.mock('expo-secure-store', () => {
  const storage = new Map<string, string>()

  return {
    getItemAsync: jest.fn(async (key: string) => storage.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      storage.set(key, value)
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      storage.delete(key)
    }),
    __storage: storage,
  }
})
