import { useSession } from '@/hooks/useSession'
import { SplashScreen } from 'expo-router'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { View } from 'react-native'

export function StartupGate({ children }: PropsWithChildren) {
  const { isInitializing } = useSession()

  if (isInitializing) {
    return null
  }

  return <>{children}</>
}

/** Hides the native splash only after the resolved route tree has laid out. */
export function SplashController({ children }: PropsWithChildren) {
  const { isInitializing } = useSession()
  const [layoutReady, setLayoutReady] = useState(false)

  useEffect(() => {
    if (!isInitializing && layoutReady) {
      void SplashScreen.hideAsync().catch(() => undefined)
    }
  }, [isInitializing, layoutReady])

  if (isInitializing) {
    return null
  }

  return (
    <View
      style={{ flex: 1 }}
      testID="splash-layout-root"
      onLayout={() => setLayoutReady(true)}
    >
      {children}
    </View>
  )
}
