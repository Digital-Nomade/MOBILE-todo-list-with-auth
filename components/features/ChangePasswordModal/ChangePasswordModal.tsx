import { Button, Input } from '@/components/atoms'
import { getErrorCode, getUserFacingMessage } from '@/config/graphql/errors'
import { StylesGuide } from '@/constants/StyleGuide'
import { useChangePasswordMutation } from '@/features/user/userApi'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, ScrollView, Text, View } from 'react-native'

interface Inputs {
  currentPassword: string
  newPassword: string
  retypePassword: string
}

interface ChangePasswordModalProps {
  visible: boolean
  onClose: () => void
}

const RATE_LIMIT_COOLDOWN_MS = 30000

export function ChangePasswordModal({
  visible,
  onClose,
}: ChangePasswordModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Inputs>()
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!visible) {
      reset()
      setServerError(null)
      setRateLimited(false)
      clearTimeout(cooldownRef.current)
    }
  }, [reset, visible])

  useEffect(() => () => clearTimeout(cooldownRef.current), [])

  async function onSubmit(data: Inputs) {
    setServerError(null)

    try {
      // Success revokes every session. The auth route guard then redirects
      // the user to login, so the modal does not need a separate success state.
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
        cooldownRef.current = setTimeout(
          () => setRateLimited(false),
          RATE_LIMIT_COOLDOWN_MS,
        )
      }
    }
  }

  const { colors, fontSizes } = StylesGuide

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        testID="change-password-modal"
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        }}
      >
        <View
          style={{
            maxHeight: '90%',
            backgroundColor: colors.primary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.xll,
                marginBottom: 16,
              }}
            >
              Change password
            </Text>
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.md,
                fontWeight: '200',
                marginBottom: 32,
              }}
            >
              After changing your password you will be signed out everywhere and need to log in again.
            </Text>
            <View style={{ marginBottom: 24 }}>
              <Input
                testID="change-password-current-input"
                placeholder="current password"
                keyboardType="visible-password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                autoFocus
                onChangeText={(value) => setValue('currentPassword', value)}
                errorMessage={errors.currentPassword?.message}
                {...register('currentPassword', {
                  required: 'You must provide your current password',
                })}
              />
            </View>
            <View style={{ marginBottom: 24 }}>
              <Input
                testID="change-password-new-input"
                placeholder="new password"
                keyboardType="visible-password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                onChangeText={(value) => setValue('newPassword', value)}
                errorMessage={errors.newPassword?.message}
                {...register('newPassword', {
                  required: 'Your new password must have at least 8 characters',
                  minLength: {
                    value: 8,
                    message: 'Your new password must have at least 8 characters',
                  },
                })}
              />
            </View>
            <View style={{ marginBottom: 24 }}>
              <Input
                testID="change-password-confirm-input"
                placeholder="retype new password"
                keyboardType="visible-password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                onChangeText={(value) => setValue('retypePassword', value)}
                errorMessage={errors.retypePassword?.message}
                {...register('retypePassword', {
                  required: 'You must retype your new password',
                  validate: (value: string) =>
                    watch('newPassword') === value ||
                    'Your passwords doesn`t match',
                })}
              />
            </View>
            {!!serverError && (
              <Text
                accessibilityRole="alert"
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
            <View style={{ marginBottom: 16 }}>
              <Button
                testID="change-password-submit-button"
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
            <Button
              testID="change-password-cancel-button"
              buttonType="secondary"
              variant="outlined"
              disabled={isLoading}
              onPress={onClose}
            >
              cancel
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
