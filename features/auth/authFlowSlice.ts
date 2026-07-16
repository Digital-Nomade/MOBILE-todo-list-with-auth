import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { AuthPayload, AuthState, AuthUserSnapshot, LoginAccountPayload } from './authTypes'

interface VerificationFlowPayload {
  email: string
  message: string
  resendAvailableAt?: number | null
}

const initialState: AuthState = {
  sessionStatus: 'initializing',
  accessToken: null,
  expiresIn: null,
  user: null,
  signupEmail: '',
  signupPassword: '',
  verificationEmail: '',
  verificationMessage: '',
  verificationResendAvailableAt: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    persistLoginDataForSignUp: (state, { payload: { email, password } }: PayloadAction<LoginAccountPayload>) => {
      state.signupEmail = email
      state.signupPassword = password
      state.verificationEmail = ''
      state.verificationMessage = ''
      state.verificationResendAvailableAt = null
    },
    resetAuthState: (state) => {
      state.signupEmail = ''
      state.signupPassword = ''
    },
    setVerificationFlow: (state, { payload }: PayloadAction<VerificationFlowPayload>) => {
      state.verificationEmail = payload.email
      state.verificationMessage = payload.message
      state.verificationResendAvailableAt = payload.resendAvailableAt ?? null
    },
    setVerificationResendAvailableAt: (state, { payload }: PayloadAction<number | null>) => {
      state.verificationResendAvailableAt = payload
    },
    clearVerificationFlow: (state) => {
      state.verificationEmail = ''
      state.verificationMessage = ''
      state.verificationResendAvailableAt = null
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
  setVerificationFlow,
  setVerificationResendAvailableAt,
  clearVerificationFlow,
  setCredentials,
  setUserSnapshot,
  sessionRestorationFinished,
  signOut,
} = authSlice.actions

export default authSlice.reducer
