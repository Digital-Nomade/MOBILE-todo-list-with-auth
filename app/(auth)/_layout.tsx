import { HeaderBackButton } from "@/components/atoms";
import { useSession } from "@/hooks/useSession";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isInitializing, isAuthenticated, user } = useSession()

  if (isInitializing) return null

  if (isAuthenticated && user?.status === 'ACTIVE') return <Redirect href="/(home)" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerShown: false
        }} 
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          title: '', 
          headerStyle: {
            backgroundColor: '#BF0066',
          },
          headerBackTitle: 'Login',
          headerLeft: () => <HeaderBackButton label="Login" color="#EEB0B4" />
        }}
      />
    </Stack>
  )
}
