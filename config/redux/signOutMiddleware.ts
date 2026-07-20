import { signOut } from '@/features/auth/authFlowSlice'
import type { Middleware } from '@reduxjs/toolkit'
import { api } from './api'

/** Clears RTK Query cache whenever the auth session is torn down. */
export const signOutMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  if (signOut.match(action)) {
    store.dispatch(api.util.resetApiState())
  }

  return result
}
