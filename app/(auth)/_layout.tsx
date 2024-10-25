import HeaderBackButton from "@/components/atoms/header-back-button/HeaderBackButton";
import { useSession } from "@/hooks/useSession";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { session } = useSession()

  if (session) return <Redirect href="/(home)" />

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
