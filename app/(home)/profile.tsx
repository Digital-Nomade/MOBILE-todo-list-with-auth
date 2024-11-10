import { Button } from "@/components/atoms";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppDispatch } from "@/config/redux/hooks";
import { signOut as clearCredentials } from '@/features/auth/authFlowSlice';
import { useSession } from "@/hooks/useSession";
import { Redirect } from "expo-router";
import { Text } from "react-native";

export default function Profile() {
  const dispatch = useAppDispatch()
  const { signOut } = useSession()

  function logout() {
    dispatch(clearCredentials())
    signOut()
    return <Redirect href="/(auth)" />
  }

  return (
    <GlobalWrapper>
      <Text>Profile</Text>
      <Button buttonType="primary" variant="fill" onPress={logout}>
        Logout
      </Button>
    </GlobalWrapper>
  )
}