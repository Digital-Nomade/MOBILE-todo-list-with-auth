import { api } from "@/config/redux/api";
import { LoginAccountPayload, LoginResponse } from "./authTypes";

export const authApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: build => ({
    loginUser: build.mutation({
      query: ({ email, password }: LoginAccountPayload) => ({
        url: '/auth/login',
        method: 'POST',
        body: {
          username: email,
          password,
        },
        headers: {
          'content-type': 'application/json'
        }
      }),
      transformResponse: (result: LoginResponse) => result,
      invalidatesTags: ['user']
    }),
    userProfile: build.query({
      query: () => ({
        url: '/auth/profile',
        method: 'GET',
      })
    })
  })
})

export const {
  useLoginUserMutation,
  useUserProfileQuery,
} = authApi
