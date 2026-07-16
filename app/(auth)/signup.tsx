import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppDispatch, useAppSelector } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { persistLoginDataForSignUp } from "@/features/auth/authFlowSlice";
import {
  clearStoredVerificationFlow,
  normalizeVerificationEmail,
} from "@/features/auth/verificationFlowStorage";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

interface Inputs {
  email: string
  password: string
  retypePassword: string
}

export default function SignUpScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { signupEmail: email, signupPassword: password } = useAppSelector(state => state.auth)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors
    }
  } = useForm<Inputs>()

  function onSubmit(data: Inputs) {
    clearStoredVerificationFlow()
    dispatch(persistLoginDataForSignUp({
      email: normalizeVerificationEmail(data.email),
      password: data.password,
    }))
    router.navigate('/(auth)/signup-profile')
  }

  const { colors, fontSizes } = StylesGuide

  return (
    <GlobalWrapper>
      <View
        testID="signup-screen"
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.xll,
            marginBottom: 64,
          }}
        >
          Sign Up
        </Text>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            testID="signup-email-input"
            placeholder="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            autoFocus
            onChangeText={(email) => setValue('email', email)}
            errorMessage={errors['email']?.message}
            defaultValue={email}
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
                }
              )
            }
          />
        </View>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            testID="signup-password-input"
            defaultValue={password}
            style={{ marginBottom: 16 }}
            placeholder="password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(password) => setValue('password', password)}
            errorMessage={errors['password']?.message}
            {...register('password', { required: 'Your password must have at least 6 characters', minLength: 6 })}
          />
        </View>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            testID="signup-confirm-password-input"
            style={{ marginBottom: 16 }}
            placeholder="retype password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(retypepassword) => setValue('retypePassword', retypepassword)}
            errorMessage={errors['retypePassword']?.message}
            {...register('retypePassword',
              { 
                required: 'You must retype your password',
                validate: (data: string) => {
                  if(watch('password') !== data) {
                    return 'Your passwords doesn`t match'
                  }
                } 
              })
            }
          />
        </View>
        <View style={{ marginBottom: 40 }}>
          <Button
            testID="signup-next-button"
            buttonType="secondary"
            variant="fill"
            rounded
            onPress={handleSubmit(onSubmit)}
          >
            next
          </Button>
        </View>
        <View style={{ marginTop: '30%' }}>
          <Pressable onPress={() => router.navigate('/(auth)/')}>
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.md,
                textAlign: 'center',
                fontWeight: 300,
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
