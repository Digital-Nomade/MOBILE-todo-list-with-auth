import { UserStatus } from '../auth/authTypes'

export interface UserProfile {
  id: string
  name: string
  lastName: string
  username: string
  email: string
  /** ISO-8601 string */
  birthdate: string
  profilePicture: string | null
  status: UserStatus
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Editable profile fields only. The generated UpdateUserDTO also exposes
 * email and username, but the backend rejects changes to them, so they are
 * intentionally excluded here and from mutation variables.
 */
export interface UpdateProfileInput {
  name?: string
  lastName?: string
  /** ISO-8601 string */
  birthdate?: string
  profilePicture?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResult {
  id: string
  updatedAt: string
}
