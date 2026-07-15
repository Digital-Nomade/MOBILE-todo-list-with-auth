import { api } from "@/config/redux/api";
import {
  AuthPayload,
  CreateUserInput,
  LoginInput,
  MessagePayload,
  VerifiedUser,
} from "./authTypes";
import {
  CREATE_USER_MUTATION,
  LOGIN_MUTATION,
  LOGOUT_ALL_MUTATION,
  LOGOUT_MUTATION,
  REFRESH_TOKEN_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESEND_VERIFICATION_MUTATION,
  RESET_PASSWORD_MUTATION,
  VERIFY_EMAIL_MUTATION,
} from "./documents";
import { applyAuthPayload, clearSession } from "./session";
import { getRefreshToken } from "./tokenStorage";

export const authApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: build => ({
    login: build.mutation<AuthPayload, LoginInput>({
      query: (input) => ({
        document: LOGIN_MUTATION,
        variables: { input },
        anonymous: true,
      }),
      transformResponse: (data: { login: AuthPayload }) => data.login,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          await applyAuthPayload(dispatch, data)
        } catch {
          // surfaced to the caller via the mutation result
        }
      },
      invalidatesTags: ['user'],
    }),
    createUser: build.mutation<MessagePayload, CreateUserInput>({
      query: (input) => ({
        document: CREATE_USER_MUTATION,
        variables: { input },
        anonymous: true,
      }),
      transformResponse: (data: { createUser: MessagePayload }) => data.createUser,
    }),
    /**
     * Restores the session on startup from the stored refresh token.
     * Success and failure both flow through the same atomic apply/clear
     * helpers used by the reauth middleware.
     */
    restoreSession: build.mutation<AuthPayload, void>({
      async queryFn(_, __, ___, baseQuery) {
        const refreshToken = await getRefreshToken()

        if (!refreshToken) {
          return { error: { code: 'UNAUTHENTICATED' as const, message: 'No stored session.' } }
        }

        const result = await baseQuery({
          document: REFRESH_TOKEN_MUTATION,
          variables: { input: { refreshToken } },
          anonymous: true,
        })

        if (result.error) {
          return { error: result.error }
        }

        return { data: (result.data as { refreshToken: AuthPayload }).refreshToken }
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          await applyAuthPayload(dispatch, data)
        } catch {
          await clearSession(dispatch)
        }
      },
    }),
    logout: build.mutation<MessagePayload, void>({
      async queryFn(_, __, ___, baseQuery) {
        const refreshToken = await getRefreshToken()

        if (!refreshToken) {
          return { data: { message: 'Logged out.' } }
        }

        const result = await baseQuery({
          document: LOGOUT_MUTATION,
          variables: { refreshToken },
        })

        if (result.error) {
          return { error: result.error }
        }

        return { data: (result.data as { logout: MessagePayload }).logout }
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          // the failure surfaces via the mutation result
        } finally {
          // even a network or expired-token failure must not trap the user
          // in a stale session
          await clearSession(dispatch)
        }
      },
    }),
    logoutAll: build.mutation<MessagePayload, void>({
      query: () => ({ document: LOGOUT_ALL_MUTATION }),
      transformResponse: (data: { logoutAll: MessagePayload }) => data.logoutAll,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          // the failure surfaces via the mutation result
        } finally {
          await clearSession(dispatch)
        }
      },
    }),
    verifyEmail: build.mutation<VerifiedUser, { token: string }>({
      query: (input) => ({
        document: VERIFY_EMAIL_MUTATION,
        variables: { input },
        anonymous: true,
      }),
      transformResponse: (data: { verifyEmail: VerifiedUser }) => data.verifyEmail,
    }),
    resendVerification: build.mutation<MessagePayload, { email: string }>({
      query: (input) => ({
        document: RESEND_VERIFICATION_MUTATION,
        variables: { input },
        anonymous: true,
      }),
      transformResponse: (data: { resendVerificationEmail: MessagePayload }) => data.resendVerificationEmail,
    }),
    requestPasswordReset: build.mutation<MessagePayload, { email: string }>({
      query: (input) => ({
        document: REQUEST_PASSWORD_RESET_MUTATION,
        variables: { input },
        anonymous: true,
      }),
      transformResponse: (data: { requestPasswordReset: MessagePayload }) => data.requestPasswordReset,
    }),
    resetPassword: build.mutation<MessagePayload, { token: string; newPassword: string }>({
      query: (input) => ({
        document: RESET_PASSWORD_MUTATION,
        variables: { input },
        anonymous: true,
      }),
      transformResponse: (data: { resetPassword: MessagePayload }) => data.resetPassword,
    }),
  })
})

export const {
  useLoginMutation,
  useCreateUserMutation,
  useRestoreSessionMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} = authApi
