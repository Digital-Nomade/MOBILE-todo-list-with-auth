import { TodoNavigator } from "@/components/features/Home/TodoNavigator/TodoNavigator";
import { NotificationIcon } from "@/components/icons/NotificationIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { useAppDispatch } from "@/config/redux/hooks";
import { StylesGuide } from "@/constants/StyleGuide";
import { openAddTodoModal } from "@/features/ui/modalSlice";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  return (
    <GlobalWrapper>
      <View
        testID="home-screen"
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
      >
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
      <Pressable
        testID="add-todo-button"
        style={{ marginBottom: 26 }}
        onPress={() => dispatch(openAddTodoModal())}
      >
        <PlusIcon />
      </Pressable>
      <TodoNavigator />
    </GlobalWrapper>
  )
}
