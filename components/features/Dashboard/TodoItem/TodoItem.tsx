import { CheckBox } from "@/components/atoms";
import { StylesGuide } from "@/constants/StyleGuide";
import { Todo } from "@/types/todo-types";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from "expo-router";
import { useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";

interface Props {
  todo: Todo
  onCheck: (todoId: string, isChecked: boolean) => void
  isChecked: boolean
}

export function TodoItem({ todo, onCheck, isChecked }: Props) {
  const router = useRouter()
  const [checked, setIsChecked] = useState(isChecked)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {},
    onPanResponderRelease: (_, gestureState) => {
      if(gestureState.dx < -50) {
        console.log(gestureState)
      }
    }
  })

  function handleOnCheck(todoId: string, checked: boolean) {
    onCheck(todoId, checked)
    setIsChecked(state => !state)
  }

  function handleTitleLength() {
    if(todo.title.length > 20) {
      return `${todo.title.substring(0, 20)}...`
    }
    return todo.title
  }

  function handleOpenDetails() {
    router.navigate(`/details?todo-id=${todo.id}`)
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: StylesGuide.colors.primaryTransparency,
        paddingHorizontal: 8,
        marginBottom: 8,
        borderRadius: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 16
      }}
      {...panResponder.panHandlers}
    >
      <CheckBox
        onCheck={(checked) => handleOnCheck(todo.id, checked)}
        checked={checked}
        color={StylesGuide.colors.secondary}
        size={28}
      />
      <Pressable
        style={{
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1,
          paddingVertical: 12,
        }}
        onPress={handleOpenDetails}
      >
        <Text style={{ color: StylesGuide.colors.white }}>{handleTitleLength()}</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <MaterialCommunityIcons name="text" size={24} color={StylesGuide.colors.dangerLight} style={{ opacity: todo.description ? 1 : 0.5}} />
          <MaterialCommunityIcons name="calendar-month" size={24} color={StylesGuide.colors.dangerLight} style={{ opacity: todo.dueTo || todo.reminderOn ? 1 : 0.5}} />
        </View>
      </Pressable>
    </View>
  )
}