import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { AuthPayload, AuthState, AuthUserSnapshot, LoginAccountPayload } from './authTypes'

const initialState: AuthState = {
  sessionStatus: 'initializing',
  accessToken: null,
  expiresIn: null,
  user: null,
  signupEmail: '',
  signupPassword: '',
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    persistLoginDataForSignUp: (state, { payload: { email, password } }: PayloadAction<LoginAccountPayload>) => {
      state.signupEmail = email
      state.signupPassword = password
    },
    resetAuthState: (state) => {
      state.signupEmail = ''
      state.signupPassword = ''
    },
    /** Replaces both tokens at once after login or a successful refresh. */
    setCredentials: (state, { payload }: PayloadAction<AuthPayload>) => {
      state.sessionStatus = 'authenticated'
      state.accessToken = payload.accessToken
      state.expiresIn = payload.expiresIn
      state.user = payload.user
    },
    setUserSnapshot: (state, { payload }: PayloadAction<AuthUserSnapshot>) => {
      state.user = payload
    },
    /** Marks startup restoration as finished when no session could be restored. */
    sessionRestorationFinished: (state) => {
      if (state.sessionStatus === 'initializing') {
        state.sessionStatus = 'unauthenticated'
      }
    },
    signOut: (state) => {
      state.sessionStatus = 'unauthenticated'
      state.accessToken = null
      state.expiresIn = null
      state.user = null
    },
  },
})

export const {
  persistLoginDataForSignUp,
  resetAuthState,
  setCredentials,
  setUserSnapshot,
  sessionRestorationFinished,
  signOut,
} = authSlice.actions

export default authSlice.reducer
