import { TodoDetails } from "@/components/organisms/TodoModal/TodoDetails";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function AddTodoModal() {
  const router = useRouter()

  return (
    <GlobalWrapper>
      <View style={{ position: 'relative' }}>
        <View
          style={{
            height: 2,
            width: 200,
            backgroundColor: StylesGuide.colors.dangerLight,
            borderRadius: 12,
            marginHorizontal: 'auto',
            marginBottom: 40,
          }} />
        <Pressable
          style={{ position: 'absolute', right: 0, top: -8 }}
          onPress={() => router.dismissAll()}
        >
          <Text style={{ color: StylesGuide.colors.dangerLight }}>Done</Text>
        </Pressable>
      </View>
      <TodoDetails />
    </GlobalWrapper>
  )
}