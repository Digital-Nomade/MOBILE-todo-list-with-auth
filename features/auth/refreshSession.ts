import { graphqlBaseQuery } from '@/config/graphql/baseQuery'
import { getErrorCode } from '@/config/graphql/errors'
import type { BaseQueryApi } from '@reduxjs/toolkit/query'
import { REFRESH_TOKEN_MUTATION } from './documents'
import { AuthPayload } from './authTypes'
import { applyAuthPayload } from './session'
import { getRefreshToken } from './tokenStorage'

export type RefreshSessionResult =
  | { status: 'success'; payload: AuthPayload }
  | { status: 'invalid' }
  | { status: 'network' }

let refreshPromise: Promise<RefreshSessionResult> | null = null

/** Test-only reset for single-flight refresh state between Jest cases. */
export function __resetRefreshSessionForTests(): void {
  refreshPromise = null
}

function createApiStub(
  dispatch: BaseQueryApi['dispatch'],
  getState: BaseQueryApi['getState'],
): BaseQueryApi {
  return {
    dispatch,
    getState,
    signal: undefined as unknown as AbortSignal,
    abort: () => undefined,
    extra: undefined,
    endpoint: 'refreshSession',
    type: 'mutation',
  } as BaseQueryApi
}

/** Single-flight refresh used by startup bootstrap and runtime reauth. */
export function refreshSessionOnce(
  dispatch: BaseQueryApi['dispatch'],
  getState: BaseQueryApi['getState'],
): Promise<RefreshSessionResult> {
  if (!refreshPromise) {
    refreshPromise = performRefresh(dispatch, getState).finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function performRefresh(
  dispatch: BaseQueryApi['dispatch'],
  getState: BaseQueryApi['getState'],
): Promise<RefreshSessionResult> {
  const refreshToken = await getRefreshToken()

  if (!refreshToken) {
    return { status: 'invalid' }
  }

  const result = await graphqlBaseQuery(
    {
      document: REFRESH_TOKEN_MUTATION,
      variables: { input: { refreshToken } },
      anonymous: true,
    },
    createApiStub(dispatch, getState),
    {},
  )

  if (result.error || !result.data) {
    if (getErrorCode(result.error) === 'NETWORK_ERROR') {
      return { status: 'network' }
    }

    return { status: 'invalid' }
  }

  const payload = (result.data as { refreshToken: AuthPayload }).refreshToken
  await applyAuthPayload(dispatch, payload)

  return { status: 'success', payload }
}
