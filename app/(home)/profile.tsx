import { Button } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useLogoutMutation } from "@/features/auth/authApi";
import { Text } from "react-native";

export default function Profile() {
  const [logout, { isLoading }] = useLogoutMutation()

  async function onLogout() {
    // Local auth state is cleared in the mutation's finally block, so even a
    // failed API call signs the user out; route guards handle the redirect.
    await logout().catch(() => {})
  }

  return (
    <GlobalWrapper>
      <Text>Profile</Text>
      <Button buttonType="primary" variant="fill" loading={isLoading} onPress={onLogout}>
        Logout
      </Button>
    </GlobalWrapper>
  )
}
