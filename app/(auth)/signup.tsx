import { Button } from "@/components/atoms/button/Button";
import { Input } from "@/components/atoms/input/Input";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { Styles } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";



export default function SignUpScreen() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm()

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
            style={{ marginBottom: 16 }}
            placeholder="password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
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
          />
        </View>
        <View style={{ marginBottom: 40 }}>
          <Button buttonType="secondary" variant="fill" rounded loading>
            next
          </Button>
        </View>
        <View style={{ marginTop: '30%' }}>
          <Pressable onPress={() => router.navigate('/(auth)/')}>
            <Text style={{ color: colors.dangerLight, fontSize: fontSizes.md, textAlign: 'center' }}>Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text></Text>
          </Pressable>
        </View>
      </View>
    </GlobalWrapper>
  );
}
