import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import {
  AuthData,
  AuthenticateUserPayload,
  LoginAccountPayload
} from './authTypes'

const initialState: AuthData = {
  email: '',
  password: '',
  isUserAuthenticated: false,
  credentials: {
    accessToken: null,
  },
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    persistLoginDataForSignUp: (state, { payload: { email, password}}: PayloadAction<LoginAccountPayload>) => {
      state.email = email
      state.password = password

    },
    resetAuthState: (state) => {
      state.email = ''
      state.password = ''
    },
    authenticateUser: (state, { payload: { isAuthenticated, accessToken } }: PayloadAction<AuthenticateUserPayload>) => {
      state.isUserAuthenticated = isAuthenticated
      state.credentials.accessToken = accessToken
    },
    signOut: (state) => {
      state.credentials.accessToken = null
    }
  }
})

export const {
  resetAuthState,
  authenticateUser,
  signOut,
  persistLoginDataForSignUp,
} = authSlice.actions

export default authSlice.reducer