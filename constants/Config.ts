import { Platform } from 'react-native'

export function resolveGraphqlUrl(
  platformOs: typeof Platform.OS = Platform.OS,
  envUrl = process.env.EXPO_PUBLIC_GRAPHQL_URL,
): string {
  if (envUrl) {
    return envUrl
  }

  const host = platformOs === 'android' ? '10.0.2.2' : 'localhost'
  return `http://${host}:3773/graphql`
}

export function resolveGraphqlWsUrl(
  graphqlUrl: string,
  envWsUrl = process.env.EXPO_PUBLIC_GRAPHQL_WS_URL,
): string {
  return envWsUrl ?? graphqlUrl.replace(/^http/, 'ws')
}

const graphqlUrl = resolveGraphqlUrl()

export const Config = {
  graphqlUrl,
  graphqlWsUrl: resolveGraphqlWsUrl(graphqlUrl),
  requestTimeoutMs: 20000,
}
