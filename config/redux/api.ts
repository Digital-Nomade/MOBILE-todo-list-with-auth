import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from './store'

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3000/',
  timeout: 20000,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.credentials.accessToken

    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }

    return headers
  }
})

export const api = createApi({
  keepUnusedDataFor: 0,
  refetchOnReconnect: true,
  reducerPath: 'YouDoMuchMoreAPI',
  tagTypes: [
    'user',
    'todos'
  ],
  baseQuery,
  endpoints: () => ({})
})
