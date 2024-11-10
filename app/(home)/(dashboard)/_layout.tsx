import { HeaderBackButton } from "@/components/atoms";
import { StylesGuide } from "@/constants/StyleGuide";
import { Stack } from "expo-router";

export default function AuthLayout() {
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
        name="details"
        options={{
          headerShown: true,

          title: '', 
          headerStyle: {
            backgroundColor: '#BF0066',
          },
          headerLeft: () => <HeaderBackButton color={StylesGuide.colors.dangerLight} label='back'/>,
          presentation: 'card',
        }}
      />
    </Stack>
  )
}
