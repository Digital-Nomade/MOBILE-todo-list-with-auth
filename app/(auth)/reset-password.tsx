import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getErrorCode, getUserFacingMessage } from "@/config/graphql/errors";
import { StylesGuide } from "@/constants/StyleGuide";
import { useResetPasswordMutation } from "@/features/auth/authApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

interface Inputs {
  newPassword: string
  retypePassword: string
}

const RATE_LIMIT_COOLDOWN_MS = 30000

/** /reset-password?token=... deep-link target. */
export default function ResetPasswordScreen() {
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<Inputs>()
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  async function onSubmit(data: Inputs) {
    if (!token) return

    setFeedback(null)

    try {
      await resetPassword({ token, newPassword: data.newPassword }).unwrap()
      router.replace('/(auth)')
    } catch (error) {
      setFeedback(getUserFacingMessage(error, {
        BAD_USER_INPUT: 'This reset link is invalid or has expired. Request a new one.',
        UNAUTHENTICATED: 'This reset link is invalid or has expired. Request a new one.',
      }))

      if (getErrorCode(error) === 'TOO_MANY_REQUESTS') {
        setRateLimited(true)
        clearTimeout(cooldownRef.current)
        cooldownRef.current = setTimeout(() => setRateLimited(false), RATE_LIMIT_COOLDOWN_MS)
      }
    }
  }

  const { colors, fontSizes } = StylesGuide

  if (!token) {
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
            Reset password
          </Text>
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.lg,
              fontWeight: '200',
              marginBottom: 48,
            }}
          >
            This reset link is incomplete. Please open the link from your email again or request a new one.
          </Text>
          <Button
            buttonType="secondary"
            variant="fill"
            rounded
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            request a new link
          </Button>
        </View>
      </GlobalWrapper>
    )
  }

  return (
    <GlobalWrapper>
      <View style={{ flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.xll,
            marginBottom: 64,
          }}
        >
          Reset password
        </Text>
        <View style={{ marginBottom: 40 }}>
          <Input
            placeholder="new password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            autoFocus
            onChangeText={(value) => setValue('newPassword', value)}
            errorMessage={errors['newPassword']?.message}
            {...register('newPassword', {
              required: 'Your password must have at least 6 characters',
              minLength: {
                value: 6,
                message: 'Your password must have at least 6 characters',
              },
            })}
          />
        </View>
        <View style={{ marginBottom: 40 }}>
          <Input
            placeholder="retype new password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(value) => setValue('retypePassword', value)}
            errorMessage={errors['retypePassword']?.message}
            {...register('retypePassword', {
              required: 'You must retype your password',
              validate: (value: string) => {
                if (watch('newPassword') !== value) {
                  return 'Your passwords doesn`t match'
                }
              },
            })}
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
        <Button
          buttonType="secondary"
          variant="fill"
          rounded
          loading={isLoading}
          disabled={isLoading || rateLimited}
          onPress={handleSubmit(onSubmit)}
        >
          reset password
        </Button>
      </View>
    </GlobalWrapper>
  )
}
