import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getErrorCode, getUserFacingMessage } from "@/config/graphql/errors";
import { StylesGuide } from "@/constants/StyleGuide";
import { useRequestPasswordResetMutation } from "@/features/auth/authApi";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

interface Inputs {
  email: string
}

const RATE_LIMIT_COOLDOWN_MS = 30000

export default function ForgotPasswordScreen() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: {
      errors
    }
  } = useForm<Inputs>()
  const [requestPasswordReset, { isLoading }] = useRequestPasswordResetMutation()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  async function onSubmit(data: Inputs) {
    setFeedback(null)

    try {
      // Always show the generic server message to avoid account enumeration.
      const { message } = await requestPasswordReset({ email: data.email }).unwrap()
      setFeedback(message)
      setSubmitted(true)
    } catch (error) {
      setFeedback(getUserFacingMessage(error))

      if (getErrorCode(error) === 'TOO_MANY_REQUESTS') {
        setRateLimited(true)
        clearTimeout(cooldownRef.current)
        cooldownRef.current = setTimeout(() => setRateLimited(false), RATE_LIMIT_COOLDOWN_MS)
      }
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
          Forgot password
        </Text>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.lg,
            fontWeight: '200',
            marginBottom: 48,
          }}
        >
          Enter your email and we will send you a link to reset your password.
        </Text>
        <View style={{ marginBottom: 40 }}>
          <Input
            placeholder="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            autoFocus
            onChangeText={(value) => setValue('email', value)}
            errorMessage={errors['email']?.message}
            {
              ...register('email',
              {
                required: 'You must provide a valid email',
                validate: (val: string) => {
                  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
                  if (!regex.test(val)) {
                    return 'You must provide a valid email'
                  }
                }
              })
            }
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
          {submitted ? 'send it again' : 'send reset link'}
        </Button>
      </View>
    </GlobalWrapper>
  )
}
