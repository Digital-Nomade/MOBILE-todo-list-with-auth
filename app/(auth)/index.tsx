import { Button } from "@/components/atoms/button/Button";
import { Input } from "@/components/atoms/input/Input";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { Styles } from "@/constants/Colors";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
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
    formState: {
      errors
    }
  } = useForm<FormInputs>()
  const [loading, setLoading] = useState(false)

  function onSubmit() {
    setLoading(true)
    console.log('helo')

    setTimeout(() => {
      setLoading(false)
      router.navigate('')
    }, 2000)
  }

  const { colors, fontSizes } = Styles

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
            autoFocus
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
            loading={loading}
            onPress={handleSubmit(onSubmit)}
          >
            login
          </Button>
        </View>
        <View style={{ marginTop: '30%' }}>
          <Pressable onPress={() => router.navigate('/(auth)/signup')}>
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
