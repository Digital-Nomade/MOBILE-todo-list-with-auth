import { api } from "@/config/redux/api";
import { clearSession } from "../auth/session";
import {
  CHANGE_PASSWORD_MUTATION,
  ME_QUERY,
  UPDATE_PROFILE_MUTATION,
} from "./documents";
import {
  ChangePasswordInput,
  ChangePasswordResult,
  UpdateProfileInput,
  UserProfile,
} from "./userTypes";

export const userApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: build => ({
    me: build.query<UserProfile, void>({
      query: () => ({ document: ME_QUERY }),
      transformResponse: (data: { me: UserProfile }) => data.me,
      providesTags: ['user'],
    }),
    updateProfile: build.mutation<UserProfile, UpdateProfileInput>({
      // Only editable fields are sent; email and username must never be
      // included because the backend rejects changes to them.
      query: (input) => ({
        document: UPDATE_PROFILE_MUTATION,
        variables: {
          input: {
            name: input.name,
            lastName: input.lastName,
            birthdate: input.birthdate,
            profilePicture: input.profilePicture,
          },
        },
      }),
      transformResponse: (data: { updateProfile: UserProfile }) => data.updateProfile,
      invalidatesTags: ['user'],
    }),
    changePassword: build.mutation<ChangePasswordResult, ChangePasswordInput>({
      query: (input) => ({
        document: CHANGE_PASSWORD_MUTATION,
        variables: { input },
      }),
      transformResponse: (data: { changePassword: ChangePasswordResult }) => data.changePassword,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // A successful change revokes every session server-side, so the
          // local one must be cleared too; route guards redirect to login.
          await clearSession(dispatch)
        } catch {
          // surfaced to the caller via the mutation result
        }
      },
    }),
  })
})

export const {
  useMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi
