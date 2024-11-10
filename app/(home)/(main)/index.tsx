import { TodoNavigator } from "@/components/features/Home/TodoNavigator/TodoNavigator";
import { NotificationIcon } from "@/components/icons/NotificationIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter()

  return (
    <GlobalWrapper>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Text
          style={{
            fontSize: StylesGuide.fontSizes.xll,
            color: StylesGuide.colors.white,
            fontWeight: '200',
          }}
        >
          Welcome Bruno
        </Text>
        <Pressable onPress={() => router.navigate('/notifications')}>
          <NotificationIcon hasNotification />
        </Pressable>
      </View>
      <Pressable style={{ marginBottom: 26 }} onPress={() => router.push('/addTodoModal')}>
        <PlusIcon />
      </Pressable>
      <TodoNavigator />
    </GlobalWrapper>
  )
}
