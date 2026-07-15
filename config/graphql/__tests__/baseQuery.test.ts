import { graphqlBaseQuery } from '@/config/graphql/baseQuery'
import type { BaseQueryApi } from '@reduxjs/toolkit/query'
import { graphqlError, graphqlSuccess, mockFetch, parseGraphQLCall } from '@/test-utils'

function fakeApi(accessToken: string | null = null): BaseQueryApi {
  return {
    getState: () => ({ auth: { accessToken } }),
    dispatch: jest.fn(),
    signal: undefined as unknown as AbortSignal,
    abort: jest.fn(),
    extra: undefined,
    endpoint: 'test',
    type: 'query',
  } as unknown as BaseQueryApi
}

describe('graphqlBaseQuery', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  it('posts the document and variables to /graphql and returns data', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({ me: { id: 'abc' } }))

    const result = await graphqlBaseQuery(
      { document: 'query Me { me { id } }', variables: {} },
      fakeApi('token-123'),
      {}
    )

    expect(result.data).toEqual({ me: { id: 'abc' } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/graphql')
    expect(init.method).toBe('POST')

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.query).toContain('query Me')
    expect(call.headers['content-type']).toBe('application/json')
  })

  it('attaches the access token to protected operations', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({ me: { id: 'abc' } }))

    await graphqlBaseQuery({ document: 'query Me { me { id } }' }, fakeApi('token-123'), {})

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.headers.authorization).toBe('Bearer token-123')
  })

  it('never attaches the access token to anonymous operations', async () => {
    fetchMock.mockResolvedValueOnce(graphqlSuccess({ login: {} }))

    await graphqlBaseQuery(
      { document: 'mutation Login { login }', anonymous: true },
      fakeApi('token-123'),
      {}
    )

    const call = parseGraphQLCall(fetchMock.mock.calls[0])
    expect(call.headers.authorization).toBeUndefined()
  })

  it('treats HTTP 200 responses with an errors array as failures', async () => {
    fetchMock.mockResolvedValueOnce(graphqlError('UNAUTHENTICATED'))

    const result = await graphqlBaseQuery({ document: 'query Me { me { id } }' }, fakeApi(), {})

    expect(result.data).toBeUndefined()
    expect(result.error).toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  it('branches on extensions.code, not on the message text', async () => {
    fetchMock.mockResolvedValueOnce(graphqlError('FORBIDDEN', 'environment specific wording'))

    const result = await graphqlBaseQuery({ document: 'query Me { me { id } }' }, fakeApi(), {})

    expect(result.error).toMatchObject({ code: 'FORBIDDEN' })
    expect(result.error?.message).not.toContain('environment specific wording')
  })

  it('normalizes unreachable-server failures to NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'))

    const result = await graphqlBaseQuery({ document: 'query Me { me { id } }' }, fakeApi(), {})

    expect(result.error).toMatchObject({ code: 'NETWORK_ERROR' })
  })
})
