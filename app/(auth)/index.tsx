import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppDispatch } from "@/config/redux/hooks";
import { getErrorCode, getUserFacingMessage } from "@/config/graphql/errors";
import { StylesGuide } from "@/constants/StyleGuide";
import { useLoginMutation } from "@/features/auth/authApi";
import { persistLoginDataForSignUp } from "@/features/auth/authFlowSlice";
import {
  beginEmailVerificationFlow,
  emailFromLoginIdentifier,
} from "@/features/auth/verificationNavigation";
import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

interface FormInputs {
  identifier: string
  password: string
}

const RATE_LIMIT_COOLDOWN_MS = 30000

export default function Index() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<FormInputs>()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  async function onSubmit(data: FormInputs) {
    setServerError(null)

    try {
      const payload = await login({
        identifier: data.identifier,
        password: data.password,
      }).unwrap()

      if (payload.user.status === 'PENDING_VERIFICATION') {
        beginEmailVerificationFlow({
          dispatch,
          router,
          email: payload.user.email,
        })
        return
      }
      // ACTIVE users are redirected by the (auth) layout guard.
      // SUSPENDED users normally fail with FORBIDDEN and land in the catch.
    } catch (error) {
      const code = getErrorCode(error)

      if (code === 'FORBIDDEN') {
        const email = emailFromLoginIdentifier(data.identifier)

        if (email) {
          dispatch(persistLoginDataForSignUp({ email, password: data.password }))
          beginEmailVerificationFlow({
            dispatch,
            router,
            email,
            message: 'Confirm your email to sign in.',
          })
          return
        }
      }

      setServerError(getUserFacingMessage(error, {
        UNAUTHENTICATED: 'Invalid credentials. Please try again.',
        FORBIDDEN: 'This account is not available. Verify your email or contact support.',
      }))

      if (code === 'TOO_MANY_REQUESTS') {
        setRateLimited(true)
        clearTimeout(cooldownRef.current)
        cooldownRef.current = setTimeout(() => setRateLimited(false), RATE_LIMIT_COOLDOWN_MS)
      }
    }
  }

  const { colors, fontSizes } = StylesGuide

  return (
    <GlobalWrapper>
      <View
        testID="login-screen"
        style={{ flexDirection: 'column', justifyContent: 'center', height: '100%', }}
      >
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.xll,
            marginBottom: 64,
          }}
        >
          Login
        </Text>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            testID="login-identifier-input"
            placeholder="email or username"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(value) => setValue('identifier', value)}
            autoFocus
            {
              ...register('identifier',
              {
                required: 'You must provide your email or username',
              })
            }
            errorMessage={errors['identifier']?.message}
          />
        </View>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            testID="login-password-input"
            style={{ marginBottom: 16 }}
            placeholder="password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(value) => setValue('password', value)}
            errorMessage={errors['password']?.message}
            {...register('password', {
              required: 'You must provide a password',
              minLength: 6,
            })}
          />
          <View>
            <Link
              testID="login-forgot-password-link"
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.md,
                marginLeft: 'auto',
              }}
              href="/(auth)/forgot-password"
            >
              Forgot password?
            </Link>
          </View>
        </View>
        {!!serverError && (
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.md,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            {serverError}
          </Text>
        )}
        <View style={{ marginBottom: 40 }}>
          <Button
            testID="login-submit-button"
            buttonType="secondary"
            variant="fill"
            rounded
            loading={isLoading}
            disabled={isLoading || rateLimited}
            onPress={handleSubmit(onSubmit)}
          >
            login
          </Button>
        </View>
        <View style={{ marginTop: '30%' }}>
          <Pressable
            testID="login-create-account-link"
            onPress={() => {
              dispatch(persistLoginDataForSignUp({ email: watch('identifier'), password: watch('password') }))
              router.navigate('/(auth)/signup')
            }}
          >
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.md,
                textAlign: 'center'
              }}
            >
              Don't have an account? <Text style={{ fontWeight: 'bold' }}>Create account</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </GlobalWrapper>
  );
}
