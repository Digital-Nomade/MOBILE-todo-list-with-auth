import { store } from "@/config/redux/store";
import { SessionProvider, useSession } from "@/hooks/useSession";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Provider } from "react-redux";

SplashScreen.preventAutoHideAsync()

/** Keeps the splash visible until session restoration finishes. */
function SplashController() {
  const { isInitializing } = useSession()

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync()
    }
  }, [isInitializing])

  return null
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionProvider>
          <SplashController />
          <Slot />
        </SessionProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
