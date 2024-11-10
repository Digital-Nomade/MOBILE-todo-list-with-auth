import { SkeletonTodoForm } from "@/components/atoms/skeleton-todo-form/SkeletonTodoForm";
import { TodoDetails } from "@/components/organisms/TodoModal/TodoDetails";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { mockedData } from "@/mocks/todo-list-mock";
import { Todo } from "@/types/todo-types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export default function Details() {
  const params = useLocalSearchParams<{'todo-id': string}>()
  const [todo, setTodo] = useState<Todo>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (params['todo-id']) {
      setLoading(true)
      setTimeout(() => {
        const todoId = params['todo-id']
        const data = mockedData.find(data => data.id === todoId)
        setTodo(data)
        setLoading(false)
      }, 1500)
    }
  }, [])

  return (
    <GlobalWrapper>
      {
      loading && !todo
        ? <SkeletonTodoForm />

        : <TodoDetails todo={todo} showCancel={false} />
      }
    </GlobalWrapper>
  )
}