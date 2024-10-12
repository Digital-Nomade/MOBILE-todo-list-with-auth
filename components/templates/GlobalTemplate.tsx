import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Props {
  children: ReactNode
}

export function GlobalWrapper({ children }: Props) {
  return (
    <GestureHandlerRootView>
      <LinearGradient
        style={{
          flex: 1,
          padding: 16
        }}
        colors={['#BF0066', '#0E003A']}
      >
        <SafeAreaView>

          { children }
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  )
}
