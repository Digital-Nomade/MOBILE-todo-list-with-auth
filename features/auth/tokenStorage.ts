import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const REFRESH_TOKEN_KEY = 'auth.refreshToken'

/**
 * Refresh-token persistence. Native platforms use the Keychain/Keystore via
 * expo-secure-store; web falls back to localStorage (the backend does not
 * currently issue httpOnly cookies).
 *
 * Access tokens are intentionally NOT handled here: they live in memory only.
 */
export async function saveRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    }
    return
  }

  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    }
    return null
  }

  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    return
  }

  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}
