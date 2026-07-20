import { AppDispatch } from '@/config/redux/store'
import {
  clearVerificationFlow,
  resetAuthState,
  setUserSnapshot,
} from '@/features/auth/authFlowSlice'
import {
  AuthPayload,
  AuthUserSnapshot,
  LoginInput,
  VerifiedUser,
} from '@/features/auth/authTypes'
import {
  clearStoredVerificationFlow,
  normalizeVerificationEmail,
} from '@/features/auth/verificationFlowStorage'
import { Router } from 'expo-router'

export type VerificationCompletionResult = 'home' | 'manual-login'

interface PendingCredentials {
  email: string
  password: string
}

interface CompleteEmailVerificationOptions {
  dispatch: AppDispatch
  router: Router
  verifiedUser: VerifiedUser
  isAuthenticated: boolean
  currentUser: AuthUserSnapshot | null
  pendingCredentials: PendingCredentials | null
  login: (input: LoginInput) => { unwrap: () => Promise<AuthPayload> }
}

function emailsMatch(first: string, second: string): boolean {
  return normalizeVerificationEmail(first) === normalizeVerificationEmail(second)
}

/** Clears verification flow state and routes verified users into the app when possible. */
export async function completeEmailVerification({
  dispatch,
  router,
  verifiedUser,
  isAuthenticated,
  currentUser,
  pendingCredentials,
  login,
}: CompleteEmailVerificationOptions): Promise<VerificationCompletionResult> {
  clearStoredVerificationFlow()
  dispatch(clearVerificationFlow())

  if (verifiedUser.status !== 'ACTIVE') {
    return 'manual-login'
  }

  if (isAuthenticated && currentUser && emailsMatch(currentUser.email, verifiedUser.email)) {
    dispatch(setUserSnapshot(verifiedUser))
    router.replace('/(home)')
    return 'home'
  }

  if (
    pendingCredentials?.password &&
    emailsMatch(pendingCredentials.email, verifiedUser.email)
  ) {
    try {
      await login({
        identifier: pendingCredentials.email,
        password: pendingCredentials.password,
      }).unwrap()
      dispatch(resetAuthState())
      router.replace('/(home)')
      return 'home'
    } catch {
      return 'manual-login'
    }
  }

  return 'manual-login'
}
