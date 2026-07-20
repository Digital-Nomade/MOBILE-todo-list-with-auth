import { AppDispatch } from '@/config/redux/store'
import { setVerificationFlow } from '@/features/auth/authFlowSlice'
import {
  normalizeVerificationEmail,
  saveVerificationFlow,
} from '@/features/auth/verificationFlowStorage'
import { Router } from 'expo-router'

const DEFAULT_MESSAGE =
  'Enter the confirmation code sent to your email to continue using the app.'

interface BeginVerificationFlowOptions {
  dispatch: AppDispatch
  router: Router
  email: string
  message?: string
}

/** Persists verification context and navigates to the confirmation-code screen. */
export function beginEmailVerificationFlow({
  dispatch,
  router,
  email,
  message = DEFAULT_MESSAGE,
}: BeginVerificationFlowOptions): void {
  const normalizedEmail = normalizeVerificationEmail(email)
  const snapshot = {
    email: normalizedEmail,
    message,
    resendAvailableAt: null as number | null,
    requestCodeOnEntry: true,
  }

  saveVerificationFlow(snapshot)
  dispatch(setVerificationFlow(snapshot))
  router.replace('/(auth)/check-email')
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function identifierLooksLikeEmail(identifier: string): boolean {
  return EMAIL_PATTERN.test(identifier.trim())
}

export function emailFromLoginIdentifier(identifier: string): string | null {
  const trimmed = identifier.trim()
  return identifierLooksLikeEmail(trimmed) ? normalizeVerificationEmail(trimmed) : null
}
