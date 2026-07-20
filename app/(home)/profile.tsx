import { Button, DatePicker, Input, Switch } from "@/components/atoms";
import { ChangePasswordModal } from "@/components/features/ChangePasswordModal/ChangePasswordModal";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getUserFacingMessage } from "@/config/graphql/errors";
import { useAppDispatch } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { useLogoutAllMutation, useLogoutMutation } from "@/features/auth/authApi";
import { useTodoSyncState } from "@/features/todos/offline/hooks";
import {
  disableLocalOnlyMode,
  enableLocalOnlyMode,
} from "@/features/todos/offline/todoService";
import { useMeQuery, useUpdateProfileMutation } from "@/features/user/userApi";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

interface ProfileInputs {
  name: string
  lastName: string
  birthdate: Date
  profilePicture: string
}

export default function Profile() {
  const dispatch = useAppDispatch()
  const syncState = useTodoSyncState()
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [localOnlyLoading, setLocalOnlyLoading] = useState(false)
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<ProfileInputs>()

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        lastName: profile.lastName,
        birthdate: new Date(profile.birthdate),
        profilePicture: profile.profilePicture ?? '',
      })
    }
  }, [profile, reset])

  // Email and username are shown read-only and are never sent in the
  // mutation: the backend rejects changes to those fields.
  async function onSave(data: ProfileInputs) {
    setFeedback(null)

    try {
      const updated = await updateProfile({
        name: data.name,
        lastName: data.lastName,
        birthdate: data.birthdate.toISOString(),
        profilePicture: data.profilePicture || undefined,
      }).unwrap()

      reset({
        name: updated.name,
        lastName: updated.lastName,
        birthdate: new Date(updated.birthdate),
        profilePicture: updated.profilePicture ?? '',
      })

      setFeedback('Profile updated.')
    } catch (error) {
      setFeedback(getUserFacingMessage(error))
    }
  }

  async function onLogout() {
    // Local auth state is cleared in the mutation's finally block, so even a
    // failed API call signs the user out; route guards handle the redirect.
    await logout().catch(() => {})
  }

  async function onLogoutAll() {
    await logoutAll().catch(() => {})
  }

  async function onToggleLocalOnly(nextValue: boolean) {
    if (!profile?.id) {
      return
    }

    setFeedback(null)

    if (nextValue) {
      Alert.alert(
        'Move todos to this device?',
        'This saves a verified copy on this device, then permanently deletes those todos from the server. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move todos',
            style: 'destructive',
            onPress: async () => {
              setLocalOnlyLoading(true)
              try {
                const localStore = await enableLocalOnlyMode(dispatch, profile.id)
                setFeedback(
                  localStore.localOnlyMigration
                    ? 'Todos are safe on this device. Server cleanup will retry when connected.'
                    : 'Local-only mode enabled. Server todos were moved to this device.',
                )
              } catch (error) {
                setFeedback(getUserFacingMessage(error, {
                  UNKNOWN: error instanceof Error ? error.message : 'Could not enable local-only mode.',
                }))
              } finally {
                setLocalOnlyLoading(false)
              }
            },
          },
        ],
      )
      return
    }

    Alert.alert(
      'Upload local todos?',
      'Disabling local-only mode will compare your local todos with the last server snapshot and upload changes in the background. Existing server todos are not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload changes',
          style: 'default',
          onPress: async () => {
            setLocalOnlyLoading(true)
            try {
              await disableLocalOnlyMode(dispatch, profile.id, true)
              setFeedback('Local-only mode disabled. Upload started in the background.')
            } catch (error) {
              setFeedback(getUserFacingMessage(error))
            } finally {
              setLocalOnlyLoading(false)
            }
          },
        },
      ]
    )
  }

  const { colors, fontSizes } = StylesGuide

  if (isLoadingProfile) {
    return (
      <GlobalWrapper>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.dangerLight} />
        </View>
      </GlobalWrapper>
    )
  }

  if (profileError || !profile) {
    return (
      <GlobalWrapper>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.lg,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {getUserFacingMessage(profileError)}
          </Text>
          <Button buttonType="primary" variant="fill" loading={isLoggingOut} onPress={onLogout}>
            Logout
          </Button>
        </View>
      </GlobalWrapper>
    )
  }

  return (
    <GlobalWrapper>
      <ScrollView testID="profile-screen" showsVerticalScrollIndicator={false}>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.xll,
            marginBottom: 32,
          }}
        >
          Profile
        </Text>
        <Text
          style={{
            color: colors.dangerLight,
            fontSize: fontSizes.md,
            fontWeight: '200',
            marginBottom: 32,
          }}
        >
          {profile.username} · {profile.email}
        </Text>
        <View style={{ marginBottom: 32 }}>
          <Input
            testID="profile-name-input"
            placeholder="name"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            value={watch('name')}
            onChangeText={(value) => setValue('name', value, { shouldDirty: true })}
            errorMessage={errors['name']?.message}
            {...register('name', { required: 'You must provide your name' })}
          />
        </View>
        <View style={{ marginBottom: 32 }}>
          <Input
            testID="profile-last-name-input"
            placeholder="last name"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            value={watch('lastName')}
            onChangeText={(value) => setValue('lastName', value, { shouldDirty: true })}
            errorMessage={errors['lastName']?.message}
            {...register('lastName', { required: 'You must provide your last name' })}
          />
        </View>
        <View style={{ marginBottom: 32 }}>
          <Input
            testID="profile-picture-input"
            placeholder="profile picture URL"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            value={watch('profilePicture')}
            onChangeText={(value) => setValue('profilePicture', value, { shouldDirty: true })}
            {...register('profilePicture')}
          />
        </View>
        <View style={{ marginBottom: 32, flexDirection: 'row', gap: 8 }}>
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.lg,
              fontWeight: '200',
              marginRight: 'auto',
            }}
          >
            birthdate
          </Text>
          <DatePicker
            testID="profile-birthdate-picker"
            onChange={(date) => setValue('birthdate', date, { shouldDirty: true })}
            value={watch('birthdate')}
            mode="date"
          />
        </View>
        <View
          testID="profile-local-only-row"
          style={{
            marginBottom: 32,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.lg,
                marginBottom: 8,
              }}
            >
              Keep todos local only
            </Text>
            <Text
              style={{
                color: colors.dangerLight,
                fontSize: fontSizes.sm,
                fontWeight: '200',
              }}
            >
              When enabled, todos are stored on this device and are not sent to the server.
              Existing server todos are permanently moved to this device.
            </Text>
          </View>
          <Switch
            testID="profile-local-only-switch"
            value={syncState.localOnly}
            disabled={localOnlyLoading}
            onValueChange={onToggleLocalOnly}
            accessibilityLabel="Keep todos local only"
          />
        </View>
        {!!feedback && (
          <Text
            style={{
              color: colors.dangerLight,
              fontSize: fontSizes.md,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            {feedback}
          </Text>
        )}
        <View style={{ marginBottom: 16 }}>
          <Button
            testID="profile-save-button"
            buttonType="success"
            variant="outlined"
            loading={isSaving}
            disabled={!isDirty || isSaving}
            onPress={handleSubmit(onSave)}
          >
            Save changes
          </Button>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Button
            testID="profile-change-password-button"
            buttonType="secondary"
            variant="outlined"
            onPress={() => setChangePasswordVisible(true)}
          >
            Change password
          </Button>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Button
            testID="profile-logout-button"
            buttonType="primary"
            variant="fill"
            loading={isLoggingOut}
            disabled={isLoggingOut}
            onPress={onLogout}
          >
            Logout
          </Button>
        </View>
        <Button
          testID="profile-logout-all-button"
          buttonType="danger"
          variant="outlined"
          loading={isLoggingOutAll}
          disabled={isLoggingOutAll}
          onPress={onLogoutAll}
        >
          Logout from all devices
        </Button>
      </ScrollView>
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />
    </GlobalWrapper>
  )
}
