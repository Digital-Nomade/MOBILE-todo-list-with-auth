const USER_FIELDS = `
  id
  name
  lastName
  username
  email
  birthdate
  profilePicture
  status
  emailVerifiedAt
  createdAt
  updatedAt
`

export const ME_QUERY = `
  query Me {
    me {
      ${USER_FIELDS}
    }
  }
`

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateUserDTO!) {
    updateProfile(input: $input) {
      ${USER_FIELDS}
    }
  }
`

export const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      id
      updatedAt
    }
  }
`
