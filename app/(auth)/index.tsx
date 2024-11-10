import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppDispatch } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { useLoginUserMutation } from "@/features/auth/authApi";
import { authenticateUser, persistLoginDataForSignUp } from "@/features/auth/authFlowSlice";
import { LoginAccountPayload } from "@/features/auth/authTypes";
import { useSession } from "@/hooks/useSession";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

interface FormInputs {
  email: string
  password: string
}

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
  const { session, signIn } = useSession()
  const [login, { isLoading }] = useLoginUserMutation()

  async function onSubmit() {
    try {
      const loginPayload: LoginAccountPayload = {
        email: watch('email'),
        password: watch('password')
      }

      const result = await login(loginPayload)
      if (result.data?.token && result.data?.id) {
        dispatch(authenticateUser({ isAuthenticated: !!result.data?.token, accessToken: result.data?.token }))
        signIn()
      }
    } catch(error) {

    }
  } 

  const { colors, fontSizes } = StylesGuide

  return (
    <GlobalWrapper>
      <View style={{ flexDirection: 'column', justifyContent: 'center', height: '100%', }} >
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
            placeholder="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(value) => setValue('email', value)}
            autoFocus
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
            errorMessage={errors['email']?.message}
          />
        </View>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
            style={{ marginBottom: 16 }}
            placeholder="password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(value) => setValue('password', value)}
            {...register('password', {
              required: 'You must provide a password',
              minLength: 6,
            })}
          />
          <View>
            <Link
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
        <View style={{ marginBottom: 40 }}>
          <Button
            buttonType="secondary"
            variant="fill"
            rounded
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
          >
            login
          </Button>
        </View>
        <View style={{ marginTop: '30%' }}>
          <Pressable onPress={() => {
              dispatch(persistLoginDataForSignUp({ email: watch('email'), password: watch('password') }))
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
