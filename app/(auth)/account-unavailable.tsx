import { Button } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppDispatch } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { clearSession } from "@/features/auth/session";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

/**
 * Landing screen for SUSPENDED accounts. Clears all local tokens and shows a
 * non-sensitive message.
 */
export default function AccountUnavailableScreen() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    clearSession(dispatch)
  }, [])

  const { colors, fontSizes } = StylesGuide

  return (
    <GlobalWrapper>
      <View style={{ flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.xll,
            marginBottom: 32,
          }}
        >
          Account unavailable
        </Text>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.lg,
            fontWeight: '200',
            marginBottom: 48,
          }}
        >
          This account is currently unavailable. If you believe this is a mistake, please contact support.
        </Text>
        <Button
          buttonType="secondary"
          variant="fill"
          rounded
          onPress={() => router.replace('/(auth)')}
        >
          back to login
        </Button>
      </View>
    </GlobalWrapper>
  )
}
