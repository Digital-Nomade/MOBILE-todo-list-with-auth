export const Config = {
  graphqlUrl: process.env.EXPO_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3000/graphql',
  requestTimeoutMs: 20000,
}
