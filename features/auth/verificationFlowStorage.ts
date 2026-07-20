import { Platform } from 'react-native'

const STORAGE_KEY = 'email-verification-flow'

export interface VerificationFlowSnapshot {
  email: string
  message: string
  resendAvailableAt: number | null
  /** When true, check-email sends a code once on entry (login redirect). */
  requestCodeOnEntry?: boolean
}

let memorySnapshot: VerificationFlowSnapshot | null = null

function getSessionStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') {
    return null
  }

  return sessionStorage
}

export function normalizeVerificationEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function saveVerificationFlow(snapshot: VerificationFlowSnapshot): void {
  memorySnapshot = snapshot

  try {
    getSessionStorage()?.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // In-memory flow state still supports the current native/web session.
  }
}

export function loadVerificationFlow(): VerificationFlowSnapshot | null {
  let storedSnapshot: string | null | undefined

  try {
    storedSnapshot = getSessionStorage()?.getItem(STORAGE_KEY)
  } catch {
    return memorySnapshot
  }

  if (!storedSnapshot) {
    return memorySnapshot
  }

  try {
    const parsed = JSON.parse(storedSnapshot) as Partial<VerificationFlowSnapshot>

    if (typeof parsed.email !== 'string') {
      return memorySnapshot
    }

    return {
      email: normalizeVerificationEmail(parsed.email),
      message: typeof parsed.message === 'string' ? parsed.message : '',
      resendAvailableAt:
        typeof parsed.resendAvailableAt === 'number' ? parsed.resendAvailableAt : null,
      requestCodeOnEntry: parsed.requestCodeOnEntry === true,
    }
  } catch {
    return memorySnapshot
  }
}

export function clearStoredVerificationFlow(): void {
  memorySnapshot = null

  try {
    getSessionStorage()?.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory snapshot was still cleared.
  }
}
