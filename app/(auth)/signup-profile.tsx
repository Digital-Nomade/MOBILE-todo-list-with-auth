import { Button, DatePicker, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getErrorCode, getUserFacingMessage } from "@/config/graphql/errors";
import { useAppDispatch, useAppSelector } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { useCreateUserMutation } from "@/features/auth/authApi";
import { resetAuthState, setVerificationFlow } from "@/features/auth/authFlowSlice";
import {
  normalizeVerificationEmail,
  saveVerificationFlow,
} from "@/features/auth/verificationFlowStorage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

interface Inputs {
  name: string
  lastName: string
  username: string
  birthdate: Date
}

const RATE_LIMIT_COOLDOWN_MS = 30000

export default function SignUpProfileScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { signupEmail, signupPassword } = useAppSelector(state => state.auth)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors
    }
  } = useForm<Inputs>()
  const [createUser, { isLoading }] = useCreateUserMutation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  async function onSubmit(data: Inputs) {
    setServerError(null)

    if (!signupEmail || !signupPassword) {
      router.replace('/(auth)/signup')
      return
    }

    if (!data.birthdate) {
      setServerError('You must provide your birthdate')
      return
    }

    try {
      // The response is a generic message only: never infer from it whether
      // an account already exists.
      const email = normalizeVerificationEmail(signupEmail)
      const { message } = await createUser({
        name: data.name,
        lastName: data.lastName,
        username: data.username,
        birthdate: data.birthdate.toISOString(),
        email,
        password: signupPassword,
      }).unwrap()

      const verificationFlow = { email, message, resendAvailableAt: null }
      saveVerificationFlow(verificationFlow)
      dispatch(setVerificationFlow(verificationFlow))
      dispatch(resetAuthState())
      router.replace('/(auth)/check-email')
    } catch (error) {
      setServerError(getUserFacingMessage(error))

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
      <View
        testID="signup-profile-screen"
        style={{ flexDirection: 'column', justifyContent: 'center', height: '100%', }}
      >
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.xll,
            marginBottom: 64,
          }}
        >
          Your info
        </Text>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            testID="signup-name-input"
            placeholder="name"
            keyboardType="default"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            autoFocus
            onChangeText={(name) => setValue('name', name)}
            errorMessage={errors['name']?.message}
            {
              ...register(
                'name',
                {
                  required: 'You must provide your name',
                  minLength: 3,
                }
              )
            }
          />
        </View>
        <View style={{ marginBottom: 40 }}>
          <Input
            testID="signup-last-name-input"
            placeholder="last name"
            keyboardType="default"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(lastName) => setValue('lastName', lastName)}
            errorMessage={errors['lastName']?.message}
            {
              ...register(
                'lastName',
                {
                  required: 'You must provide your last name',
                  minLength: 3,
                }
              )
            }
          />
        </View>
        <View style={{ marginBottom: 40 }}>
          <Input
            testID="signup-username-input"
            placeholder="username"
            keyboardType="default"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(username) => setValue('username', username)}
            errorMessage={errors['username']?.message}
            {...register('username', { required: 'You must add a username'})}
          />
        </View>
        <View style={{ marginBottom: 40, flexDirection: 'row', gap: 8 }}>
          <Text
            style={{
              color: StylesGuide.colors.dangerLight,
              fontSize: StylesGuide.fontSizes.lg,
              fontWeight: 200,
              marginRight: 'auto'
            }}
          >
            birthdate
          </Text>
          <DatePicker
            testID="signup-birthdate-picker"
            onChange={(date) => setValue('birthdate', date)}
            value={watch('birthdate')}
            mode="date"
          />
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
            testID="signup-submit-button"
            buttonType="secondary"
            variant="fill"
            rounded
            loading={isLoading}
            disabled={isLoading || rateLimited}
            onPress={handleSubmit(onSubmit)}
          >
            create account
          </Button>
        </View>
        <View style={{ marginTop: '30%' }}>
          <Pressable onPress={() => router.navigate('/(auth)/')}>
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.md,
                textAlign: 'center'
              }}
            >
              Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </GlobalWrapper>
  );
}
