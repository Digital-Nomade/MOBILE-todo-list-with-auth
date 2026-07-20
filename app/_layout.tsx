import { store } from "@/config/redux/store";
import { GlobalTodoModal } from "@/components/features/GlobalTodoModal/GlobalTodoModal";
import { StartupGate, SplashController } from "@/features/startup/StartupShell";
import { TodoSyncProvider } from "@/features/todos/offline/TodoSyncProvider";
import { SessionProvider } from "@/hooks/useSession";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Slot, SplashScreen } from "expo-router";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Provider } from "react-redux";

setupListeners(store.dispatch)

void SplashScreen.preventAutoHideAsync().catch(() => undefined)

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionProvider>
          <TodoSyncProvider>
            <StartupGate>
              <SplashController>
                <Slot />
              </SplashController>
            </StartupGate>
            <GlobalTodoModal />
          </TodoSyncProvider>
        </SessionProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
