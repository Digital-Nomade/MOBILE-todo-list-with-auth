export const Config = {
  graphqlUrl: process.env.EXPO_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3773/graphql',
  requestTimeoutMs: 20000,
}
