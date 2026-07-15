import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getUserFacingMessage } from "@/config/graphql/errors";
import { useAppSelector } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { useResendVerificationMutation } from "@/features/auth/authApi";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * "Registration submitted / check your email" state. Also the landing screen
 * for PENDING_VERIFICATION accounts. Only ever shows generic server messages,
 * never whether an account exists.
 */
export default function CheckEmailScreen() {
  const router = useRouter()
  const { signupEmail, user } = useAppSelector(state => state.auth)
  const [email, setEmail] = useState(user?.email ?? signupEmail ?? '')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [resendVerification, { isLoading }] = useResendVerificationMutation()

  async function onResend() {
    if (!email) {
      setFeedback('Enter your email to resend the verification message.')
      return
    }

    try {
      const { message } = await resendVerification({ email }).unwrap()
      setFeedback(message)
    } catch (error) {
      setFeedback(getUserFacingMessage(error))
    }
  }

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
          Check your email
        </Text>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.lg,
            fontWeight: '200',
            marginBottom: 48,
          }}
        >
          We sent you a verification link. Open it on this device to activate your account.
        </Text>
        <View style={{ marginBottom: 24 }}>
          <Input
            placeholder="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            defaultValue={email}
            onChangeText={setEmail}
          />
        </View>
        {!!feedback && (
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.md,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            {feedback}
          </Text>
        )}
        <View style={{ marginBottom: 40 }}>
          <Button
            buttonType="secondary"
            variant="fill"
            rounded
            loading={isLoading}
            disabled={isLoading}
            onPress={onResend}
          >
            resend verification email
          </Button>
        </View>
        <Pressable onPress={() => router.replace('/(auth)')}>
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.md,
              textAlign: 'center',
            }}
          >
            Back to <Text style={{ fontWeight: 'bold' }}>Login</Text>
          </Text>
        </Pressable>
      </View>
    </GlobalWrapper>
  )
}
