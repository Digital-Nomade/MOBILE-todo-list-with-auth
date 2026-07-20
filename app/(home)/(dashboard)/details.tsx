import { Button } from "@/components/atoms";
import { SkeletonTodoForm } from "@/components/atoms/skeleton-todo-form/SkeletonTodoForm";
import { TodoDetails } from "@/components/organisms/TodoModal/TodoDetails";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { useOfflineTodo, useOfflineTodoMutations } from "@/features/todos/offline/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function Details() {
  const router = useRouter()
  const params = useLocalSearchParams<{'todo-id': string}>()
  const todoId = params['todo-id']
  const { data: todo, isLoading, error } = useOfflineTodo(todoId ?? '', { skip: !todoId })
  const { deleteTodo } = useOfflineTodoMutations()
  const [isDeleting, setIsDeleting] = useState(false)

  async function onDelete() {
    if (!todoId) return

    setIsDeleting(true)
    try {
      await deleteTodo(todoId)
      router.back()
    } catch {
      // list remains consistent through local store updates
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <GlobalWrapper>
        <SkeletonTodoForm />
      </GlobalWrapper>
    )
  }

  // Missing and unowned todos are indistinguishable by design.
  if (!todoId || error || !todo) {
    return (
      <GlobalWrapper>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            style={{
              color: StylesGuide.colors.dangerLight,
              fontSize: StylesGuide.fontSizes.lg,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            This to do could not be found.
          </Text>
          <Button buttonType="secondary" variant="fill" rounded onPress={() => router.back()}>
            go back
          </Button>
        </View>
      </GlobalWrapper>
    )
  }

  return (
    <GlobalWrapper>
      <TodoDetails todo={todo} showCancel={false} isEditing />
      <View style={{ marginTop: 16 }}>
        <Button
          testID="todo-delete-button"
          buttonType="danger"
          variant="outlined"
          loading={isDeleting}
          disabled={isDeleting}
          onPress={onDelete}
        >
          Delete
        </Button>
      </View>
    </GlobalWrapper>
  )
}
