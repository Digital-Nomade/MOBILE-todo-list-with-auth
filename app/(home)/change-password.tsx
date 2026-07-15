import { Button, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getErrorCode, getUserFacingMessage } from "@/config/graphql/errors";
import { StylesGuide } from "@/constants/StyleGuide";
import { useChangePasswordMutation } from "@/features/user/userApi";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

interface Inputs {
  currentPassword: string
  newPassword: string
  retypePassword: string
}

const RATE_LIMIT_COOLDOWN_MS = 30000

export default function ChangePasswordScreen() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<Inputs>()
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  async function onSubmit(data: Inputs) {
    setServerError(null)

    try {
      // Success revokes every session: local auth state is cleared by the
      // mutation and the route guards redirect to login.
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap()
    } catch (error) {
      setServerError(getUserFacingMessage(error, {
        UNAUTHENTICATED: 'Your current password is incorrect.',
        BAD_USER_INPUT: 'Your current password is incorrect or the new password is not valid.',
      }))

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
          Change password
        </Text>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.md,
            fontWeight: '200',
            marginBottom: 48,
          }}
        >
          After changing your password you will be signed out everywhere and need to log in again.
        </Text>
        <View style={{ marginBottom: 40 }}>
          <Input
            placeholder="current password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            autoFocus
            onChangeText={(value) => setValue('currentPassword', value)}
            errorMessage={errors['currentPassword']?.message}
            {...register('currentPassword', { required: 'You must provide your current password' })}
          />
        </View>
        <View style={{ marginBottom: 40 }}>
          <Input
            placeholder="new password"
            keyboardType="visible-password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(value) => setValue('newPassword', value)}
            errorMessage={errors['newPassword']?.message}
            {...register('newPassword', {
              required: 'Your new password must have at least 6 characters',
              minLength: {
                value: 6,
                message: 'Your new password must have at least 6 characters',
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
              required: 'You must retype your new password',
              validate: (value: string) => {
                if (watch('newPassword') !== value) {
                  return 'Your passwords doesn`t match'
                }
              },
            })}
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
        <Button
          buttonType="secondary"
          variant="fill"
          rounded
          loading={isLoading}
          disabled={isLoading || rateLimited}
          onPress={handleSubmit(onSubmit)}
        >
          change password
        </Button>
      </View>
    </GlobalWrapper>
  )
}
