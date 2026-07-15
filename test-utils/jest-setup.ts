import 'react-native-gesture-handler/jestSetup'

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
