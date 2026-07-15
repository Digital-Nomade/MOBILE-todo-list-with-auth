const AUTH_PAYLOAD_FIELDS = `
  accessToken
  refreshToken
  expiresIn
  user {
    id
    email
    username
    status
    emailVerifiedAt
  }
`

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      ${AUTH_PAYLOAD_FIELDS}
    }
  }
`

export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserDTO!) {
    createUser(input: $input) {
      message
    }
  }
`

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      ${AUTH_PAYLOAD_FIELDS}
    }
  }
`

export const LOGOUT_MUTATION = `
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      message
    }
  }
`

export const LOGOUT_ALL_MUTATION = `
  mutation LogoutAll {
    logoutAll {
      message
    }
  }
`

export const VERIFY_EMAIL_MUTATION = `
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      id
      email
      username
      status
      emailVerifiedAt
    }
  }
`

export const RESEND_VERIFICATION_MUTATION = `
  mutation ResendVerification($input: ResendVerificationInput!) {
    resendVerificationEmail(input: $input) {
      message
    }
  }
`

export const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      message
    }
  }
`

export const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      message
    }
  }
`
