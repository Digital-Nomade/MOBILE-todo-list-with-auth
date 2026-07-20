import { AppDispatch, RootState } from '@/config/redux/store'
import NetInfo from '@react-native-community/netinfo'
import {
  sessionRestorationFinished,
  setOfflineSession,
} from './authFlowSlice'
import { refreshSessionOnce } from './refreshSession'
import { clearSession } from './session'
import { getRefreshToken } from './tokenStorage'
import { getCachedUser } from './userCacheStorage'

async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return Boolean(state.isConnected && state.isInternetReachable !== false)
}

interface BootstrapOptions {
  cancelled: () => boolean
}

export async function bootstrapSession(
  dispatch: AppDispatch,
  getState: () => RootState,
  { cancelled }: BootstrapOptions,
): Promise<void> {
  const refreshToken = await getRefreshToken()

  if (!refreshToken) {
    if (!cancelled()) {
      dispatch(sessionRestorationFinished())
    }
    return
  }

  const online = await isDeviceOnline()

  if (!online) {
    const cachedUser = await getCachedUser()

    if (cachedUser && !cancelled()) {
      dispatch(setOfflineSession(cachedUser))
      return
    }

    if (!cancelled()) {
      dispatch(sessionRestorationFinished())
    }
    return
  }

  if (cancelled()) {
    return
  }

  const result = await refreshSessionOnce(dispatch, getState)

  if (cancelled()) {
    return
  }

  if (result.status === 'success') {
    return
  }

  if (result.status === 'network') {
    const cachedUser = await getCachedUser()

    if (cachedUser) {
      dispatch(setOfflineSession(cachedUser))
      return
    }

    dispatch(sessionRestorationFinished())
    return
  }

  await clearSession(dispatch)

  if (!cancelled()) {
    dispatch(sessionRestorationFinished())
  }
}

export async function reconnectOfflineSession(
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<'authenticated' | 'signed-out' | 'still-offline'> {
  const online = await isDeviceOnline()

  if (!online) {
    return 'still-offline'
  }

  const result = await refreshSessionOnce(dispatch, getState)

  if (result.status === 'success') {
    return 'authenticated'
  }

  if (result.status === 'invalid') {
    await clearSession(dispatch)
    return 'signed-out'
  }

  return 'still-offline'
}
