import { AuthUserSnapshot, UserStatus } from './authTypes'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const CACHED_USER_KEY = 'auth.cachedUser'

const VALID_STATUSES: UserStatus[] = ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED']

function parseCachedUser(raw: string | null): AuthUserSnapshot | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUserSnapshot>

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.username !== 'string' ||
      !VALID_STATUSES.includes(parsed.status as UserStatus)
    ) {
      return null
    }

    return {
      id: parsed.id,
      email: parsed.email,
      username: parsed.username,
      status: parsed.status as UserStatus,
      emailVerifiedAt:
        typeof parsed.emailVerifiedAt === 'string' ? parsed.emailVerifiedAt : null,
    }
  } catch {
    return null
  }
}

export async function saveCachedUser(user: AuthUserSnapshot): Promise<void> {
  const serialized = JSON.stringify(user)

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHED_USER_KEY, serialized)
    }
    return
  }

  await SecureStore.setItemAsync(CACHED_USER_KEY, serialized)
}

export async function getCachedUser(): Promise<AuthUserSnapshot | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null
    }

    return parseCachedUser(localStorage.getItem(CACHED_USER_KEY))
  }

  return parseCachedUser(await SecureStore.getItemAsync(CACHED_USER_KEY))
}

export async function clearCachedUser(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CACHED_USER_KEY)
    }
    return
  }

  await SecureStore.deleteItemAsync(CACHED_USER_KEY)
}
