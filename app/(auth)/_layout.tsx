import HeaderBackButton from "@/components/atoms/header-back-button/HeaderBackButton";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: '', headerShown: false }} />
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

        }} />
    </Stack>
  )
}
