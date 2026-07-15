import { Button, DatePicker, Input } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { getUserFacingMessage } from "@/config/graphql/errors";
import { StylesGuide } from "@/constants/StyleGuide";
import { useLogoutAllMutation, useLogoutMutation } from "@/features/auth/authApi";
import { useMeQuery, useUpdateProfileMutation } from "@/features/user/userApi";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

interface ProfileInputs {
  name: string
  lastName: string
  birthdate: Date
  profilePicture: string
}

export default function Profile() {
  const router = useRouter()
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation()
  const [feedback, setFeedback] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<ProfileInputs>()

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name)
      setValue('lastName', profile.lastName)
      setValue('birthdate', new Date(profile.birthdate))
      setValue('profilePicture', profile.profilePicture ?? '')
    }
  }, [profile])

  // Email and username are shown read-only and are never sent in the
  // mutation: the backend rejects changes to those fields.
  async function onSave(data: ProfileInputs) {
    setFeedback(null)

    try {
      await updateProfile({
        name: data.name,
        lastName: data.lastName,
        birthdate: data.birthdate.toISOString(),
        profilePicture: data.profilePicture || undefined,
      }).unwrap()

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
      <ScrollView showsVerticalScrollIndicator={false}>
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
            onChange={(date) => setValue('birthdate', date, { shouldDirty: true })}
            value={watch('birthdate')}
            mode="date"
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
            buttonType="secondary"
            variant="outlined"
            onPress={() => router.navigate('/(home)/change-password')}
          >
            Change password
          </Button>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Button
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
          buttonType="danger"
          variant="outlined"
          loading={isLoggingOutAll}
          disabled={isLoggingOutAll}
          onPress={onLogoutAll}
        >
          Logout from all devices
        </Button>
      </ScrollView>
    </GlobalWrapper>
  )
}
