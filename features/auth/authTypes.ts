export type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'

export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated'

export interface AuthUserSnapshot {
  id: string
  email: string
  username: string
  status: UserStatus
  emailVerifiedAt: string | null
}

export interface AuthPayload {
  accessToken: string
  refreshToken: string
  /** Access-token lifetime in seconds */
  expiresIn: number
  user: AuthUserSnapshot
}

export interface LoginInput {
  identifier: string
  password: string
}

export interface CreateUserInput {
  name: string
  lastName: string
  username: string
  email: string
  password: string
  /** ISO-8601 string */
  birthdate: string
  profilePicture?: string
}

export interface MessagePayload {
  message: string
}

export interface VerifiedUser {
  id: string
  email: string
  username: string
  status: UserStatus
  emailVerifiedAt: string | null
}

export interface AuthState {
  sessionStatus: SessionStatus
  /** Kept in memory only; never persisted to disk */
  accessToken: string | null
  expiresIn: number | null
  user: AuthUserSnapshot | null
  signupEmail: string
  signupPassword: string
}

export interface LoginAccountPayload {
  email: string
  password: string
}
