import { useSession } from '@/hooks/useSession'
import { Redirect } from 'expo-router'

/** Canonical startup route chosen after session restoration completes. */
export default function Index() {
  const { isInitializing, isAuthenticated, user } = useSession()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />
  }

  if (user?.status === 'PENDING_VERIFICATION') {
    return <Redirect href="/(auth)/check-email" />
  }

  if (user?.status === 'SUSPENDED') {
    return <Redirect href="/(auth)/account-unavailable" />
  }

  return <Redirect href="/(home)" />
}
