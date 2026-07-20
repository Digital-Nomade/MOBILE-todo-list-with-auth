const graphqlUrl = process.env.EXPO_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3773/graphql'

export const Config = {
  graphqlUrl,
  graphqlWsUrl:
    process.env.EXPO_PUBLIC_GRAPHQL_WS_URL ??
    graphqlUrl.replace(/^http/, 'ws'),
  requestTimeoutMs: 20000,
}
