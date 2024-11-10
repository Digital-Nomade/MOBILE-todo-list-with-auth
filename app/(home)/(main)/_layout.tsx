import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addTodoModal" options={{ presentation: 'modal' }}/>
      <Stack.Screen name="notifications" options={{ presentation: 'modal'}} />
    </Stack>
  )
}