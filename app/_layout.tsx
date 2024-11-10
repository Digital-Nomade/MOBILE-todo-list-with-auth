import { store } from "@/config/redux/store";
import { SessionProvider } from "@/hooks/useSession";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Provider } from "react-redux";

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync()
    }, 5000)
  }, [])

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionProvider>
          <Slot />
        </SessionProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
