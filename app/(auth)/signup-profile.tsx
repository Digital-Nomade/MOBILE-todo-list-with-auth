import { Button } from "@/components/atoms/button/Button";
import { DatePicker } from "@/components/atoms/date-picker/DatePicker";
import { Input } from "@/components/atoms/input/Input";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { Styles } from "@/constants/StyleGuide";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

interface Inputs {
  name: string
  lastName: string
  username: string
  birthdate: Date
}

export default function SignUpProfileScreen() {
  const router = useRouter()
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
      console.log(data)
      setLoading(false)
      router.navigate('/(auth)/code-verification')
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
          Your info
        </Text>
        <View
          style={{ marginBottom: 40 }}
        >
          <Input
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
            placeholder="username"
            keyboardType="default"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(username) => setValue('username', username)}
            errorMessage={errors['username']?.message}
            
            {...register('username', { required: 'You must add a username'})}
            onBlur={() => console.log('verify username`s existance on database')}
          />
        </View>
        <View style={{ marginBottom: 40, flexDirection: 'row', gap: 8 }}>
          <Text
            style={{
              color: Styles.colors.dangerLight,
              fontSize: Styles.fontSizes.lg,
              fontWeight: 200,
              marginRight: 'auto'
            }}
          >
            birthdate
          </Text>
          <DatePicker
            onChange={(date) => setValue('birthdate', date)}
            value={watch('birthdate')}
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
