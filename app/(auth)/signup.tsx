import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppSelector } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

interface Inputs {
  email: string
  password: string
  retypePassword: string
}

export default function SignUpScreen() {
  const router = useRouter()
  const { email, password } = useAppSelector(state => state.auth)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors
    }
  } = useForm<Inputs>()
  const [loading, setLoading] = useState(false)

  function onSubmit(data: unknown) {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.navigate('/(auth)/signup-profile')
    }, 2000)
  }

  const { colors, fontSizes } = StylesGuide

  return (
    <GlobalWrapper>
      <View
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
            style={{ marginBottom: 16 }}
            placeholder="retype password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(retypepassword) => setValue('retypePassword', retypepassword)}
            errorMessage={errors['password']?.message}
            {...register('password',
              { 
                required: true, validate: (data: unknown) => {
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
            buttonType="secondary"
            variant="fill"
            rounded
            loading={loading}
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
