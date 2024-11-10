export interface AuthData {
  email: string
  password: string
  isUserAuthenticated: boolean
  credentials: {
    accessToken: string | null,
  }
}

export interface AuthenticateUserPayload {
  isAuthenticated: boolean
  accessToken: string
}

export interface LoginAccountPayload {
  email: string
  password: string
}

export interface LoginResponse {
  id: string
  token: string
}
