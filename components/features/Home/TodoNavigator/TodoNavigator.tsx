import { CheckBox } from "@/components/atoms";
import { StylesGuide } from "@/constants/StyleGuide";
import { useFetchTodosQuery, useUpdateTodoMutation } from "@/features/todos/todoApi";
import { Todo } from "@/types/todo-types";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { AnimatePresence, MotiView } from 'moti';
import { Fragment, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

type Directions = 'next' | 'previous'

export function TodoNavigator() {
  const { data: todosData, isLoading, isFetching } = useFetchTodosQuery()
  const [updateTodo] = useUpdateTodoMutation()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(isLoading || isFetching)
  const [todos, setTodos] = useState<Todo[]>([])
  const [todoIndex, setTodoIndex] = useState(0)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (todosData?.data.length) {
      setTodos(todosData.data)
    }
  }, [todosData])

  useEffect(() => {
    setLoading(isLoading || isFetching)
  }, [isLoading, isFetching])

  function handleNavigateTodo(direction: Directions) {
    switch(direction) {
      case 'next':
        return handleNextTodo()
      case 'previous':
        return handlePreviousTodo()
      default:
        throw new Error(`No direction registered: ${direction}`)
    }
  }

  function handleNextTodo() {
    if (todos?.length && todoIndex < (todos?.length - 1)) {
      setTodoIndex(state => {
        return state + 1
      })
    }
  }

  function handlePreviousTodo() {
    if (todos?.length && todoIndex >= 0) {
      setTodoIndex(state => {
        return state - 1
      })
    }
  }

  function animateTransition(callback: () => void) {
    setAnimate(true)

    setTimeout(() => {
      callback()
      setAnimate(false)
    }, 200)
  }

  async function handleCheckTodo(todo: Todo, isChecked: boolean) {
    try {
      const response = await updateTodo({ ...todo, done: isChecked })
      console.log(response)
    } catch(error: any) {
      console.log('Algum erro ocorreu')
    }
  }

  return (
    <Fragment>
      {loading
        ? <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} size={'large'}/>
        : (
        <AnimatePresence>
          <MotiView
            style={{ flex: 1 }}
            key="main-content"
            animate={animate ? {
              translateX: -200
            } : { translateX: 0 }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
                <Text
                  style={{
                    color: StylesGuide.colors.white,
                    fontSize: StylesGuide.fontSizes.xl,
                    fontWeight: 200,
                    width: '80%',
                    lineHeight: 30,
                  }}
                >
                  {todos[todoIndex]?.title ?? ''}
                </Text>
                <CheckBox
                  checked={todos[todoIndex]?.done}
                  onCheck={(isChecked) => handleCheckTodo(todos[todoIndex], isChecked)}
                  color={StylesGuide.colors.success}
                />
            </View>
            <View style={{ marginBottom: 16 }}>
              {
                !!todos[todoIndex]?.reminderOn && (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <MaterialIcons name="access-alarm" size={24} color={StylesGuide.colors.dangerLight} />
                    <Text style={{ color: StylesGuide.colors.white, fontSize: StylesGuide.fontSizes.md, fontWeight: 600 }}>
                      {format(todos[todoIndex].reminderOn, 'hh:mm M/d/yyyy')}
                    </Text>
                  </View>
              )}
              {!!todos[todoIndex]?.dueTo && (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color={StylesGuide.colors.dangerLight} />
                  <Text style={{ color: StylesGuide.colors.white, fontSize: StylesGuide.fontSizes.md, fontWeight: 600 }}>{format(todos[todoIndex].dueTo, 'M/d/yyyy')}</Text>
                </View>
              )}
            </View>
            <ScrollView style={{ paddingVertical: 16,  }}>
              <Text style={{ color: StylesGuide.colors.white, fontSize: StylesGuide.fontSizes.md, fontWeight: 300 }}>
                {!!todos[todoIndex]?.description ? todos[todoIndex].description : 'No description'}
              </Text>
            </ScrollView>
            {
              todos[todoIndex]?.createdAt && (
              <View style={{marginBottom: 48 }}>
                <Text
                  style={{
                    textAlign: 'right',
                    color: StylesGuide.colors.white,
                    fontWeight: 200
                  }}
                >
                  created at: <Text style={{ fontWeight: 300 }}>{format(todos[todoIndex].createdAt, 'M/dd/yyyy')}</Text></Text>
              </View>
            )}
          </MotiView>
        </AnimatePresence>
      )}

      <View
        style={{
          flexDirection: 'row',
          marginTop: 'auto',
          justifyContent: 'space-between'
        }}
      >
        <Pressable
          style={{ opacity: todoIndex <= 0 ? 0.5 : 1 }}
          onPress={() => animateTransition(() => handleNavigateTodo('previous'))}
          disabled={todoIndex <= 0}
        >
          <MaterialIcons
            name="chevron-left"
            size={48}
            color={StylesGuide.colors.dangerLight}
          />
        </Pressable>
        <Pressable
          style={{ opacity: todoIndex >= (todos.length - 1) ? 0.5 : 1 }}
          onPress={() => animateTransition(() => handleNavigateTodo('next'))}
          disabled={todoIndex >= (todos.length - 1)}
        >
          <MaterialIcons
            name="chevron-right"
            size={48}
            color={StylesGuide.colors.dangerLight}
            
          />
        </Pressable>
      </View>
    </Fragment>
  )
}