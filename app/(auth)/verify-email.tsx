import { Button } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getUserFacingMessage } from "@/config/graphql/errors";
import { useAppDispatch, useAppSelector } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { useVerifyEmailMutation } from "@/features/auth/authApi";
import { setUserSnapshot } from "@/features/auth/authFlowSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

type VerificationState = 'loading' | 'success' | 'error' | 'missing-token'

/**
 * /verify-email?token=... deep-link target. Renders explicit loading,
 * success, expired/invalid-token, and retry states.
 */
export default function VerifyEmailScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const currentUser = useAppSelector(state => state.auth.user)
  const [verifyEmail] = useVerifyEmailMutation()
  const [state, setState] = useState<VerificationState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function runVerification() {
    if (!token) {
      setState('missing-token')
      return
    }

    setState('loading')
    setErrorMessage(null)

    try {
      const verifiedUser = await verifyEmail({ token }).unwrap()

      // Unlock protected routes if the pending user is currently signed in.
      if (currentUser && currentUser.id === verifiedUser.id) {
        dispatch(setUserSnapshot(verifiedUser))
      }

      setState('success')
    } catch (error) {
      setErrorMessage(getUserFacingMessage(error, {
        BAD_USER_INPUT: 'This verification link is invalid or has expired.',
        UNAUTHENTICATED: 'This verification link is invalid or has expired.',
      }))
      setState('error')
    }
  }

  useEffect(() => {
    runVerification()
  }, [token])

  const { colors, fontSizes } = StylesGuide

  const textStyle = {
    color: colors.dangerLight,
    fontSize: fontSizes.lg,
    fontWeight: '200' as const,
    marginBottom: 48,
    textAlign: 'center' as const,
  }

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
          Email verification
        </Text>

        {state === 'loading' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={textStyle}>Verifying your email...</Text>
            <ActivityIndicator size="large" color={colors.dangerLight} />
          </View>
        )}

        {state === 'success' && (
          <>
            <Text style={textStyle}>
              Your email has been verified. You can now sign in to your account.
            </Text>
            <Button
              buttonType="secondary"
              variant="fill"
              rounded
              onPress={() => router.replace('/(auth)')}
            >
              go to login
            </Button>
          </>
        )}

        {state === 'missing-token' && (
          <>
            <Text style={textStyle}>
              This verification link is incomplete. Please open the link from your email again or request a new one.
            </Text>
            <Button
              buttonType="secondary"
              variant="fill"
              rounded
              onPress={() => router.replace('/(auth)/check-email')}
            >
              resend verification email
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <Text style={textStyle}>{errorMessage}</Text>
            <View style={{ marginBottom: 24 }}>
              <Button
                buttonType="secondary"
                variant="fill"
                rounded
                onPress={runVerification}
              >
                try again
              </Button>
            </View>
            <Button
              buttonType="secondary"
              variant="outlined"
              rounded
              onPress={() => router.replace('/(auth)/check-email')}
            >
              request a new link
            </Button>
          </>
        )}
      </View>
    </GlobalWrapper>
  )
}
