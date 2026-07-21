import { resolveGraphqlUrl, resolveGraphqlWsUrl } from '../Config'

describe('Config', () => {
  it('defaults to localhost on iOS', () => {
    expect(resolveGraphqlUrl('ios')).toBe('http://localhost:3773/graphql')
    expect(resolveGraphqlWsUrl('http://localhost:3773/graphql')).toBe(
      'ws://localhost:3773/graphql',
    )
  })

  it('defaults to 10.0.2.2 on Android', () => {
    expect(resolveGraphqlUrl('android')).toBe('http://10.0.2.2:3773/graphql')
    expect(resolveGraphqlWsUrl('http://10.0.2.2:3773/graphql')).toBe(
      'ws://10.0.2.2:3773/graphql',
    )
  })

  it('derives ws url from explicit http url', () => {
    expect(resolveGraphqlUrl('android', 'https://api.example.com/graphql')).toBe(
      'https://api.example.com/graphql',
    )
    expect(resolveGraphqlWsUrl('https://api.example.com/graphql')).toBe(
      'wss://api.example.com/graphql',
    )
  })

  it('uses explicit ws url when provided', () => {
    expect(
      resolveGraphqlWsUrl(
        'http://localhost:3773/graphql',
        'ws://custom.local/graphql',
      ),
    ).toBe('ws://custom.local/graphql')
  })
})
