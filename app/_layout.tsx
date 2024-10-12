import { Stack } from "expo-router";
import { useState } from "react";

export default function RootLayout() {
  const [authenticated, setAuthenticated] = useState(false)

  if (authenticated) {
    <Stack>
      <Stack.Screen name="(home)" />
    </Stack>
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ title: '', headerTransparent: true, headerShown: false }} />
    </Stack>
  );
}
