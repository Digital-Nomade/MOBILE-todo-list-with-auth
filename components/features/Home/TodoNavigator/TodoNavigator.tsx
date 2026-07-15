import { CheckBox } from "@/components/atoms";
import { StylesGuide } from "@/constants/StyleGuide";
import { useFetchTodosQuery, useUpdateTodoMutation } from "@/features/todos/todoApi";
import { Todo } from "@/types/todo-types";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { AnimatePresence, MotiView } from 'moti';
import { Fragment, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { styles } from './TodoNavigator.styles';


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
      await updateTodo({ id: todo.id, done: isChecked }).unwrap()
    } catch {
      // list refetch (cache invalidation) restores the real state
    }
  }

  const currentTodo: Todo | undefined = todos[todoIndex]

  return (
    <Fragment>
      {loading
        ? <ActivityIndicator
            style={styles.activityIndicator}
            size={'large'}
          />
        : (
        <AnimatePresence>
          <MotiView
            style={styles.motionView}
            key="main-content"
            animate={animate 
            ? {
              translateX: -400
            } 
            : { 
              translateX: 0 
            }}
          >
            <View style={styles.mainContainer}>
                <Text style={styles.titleText}>
                  {currentTodo?.title ?? ''}
                </Text>
                <CheckBox
                  checked={currentTodo?.done}
                  onCheck={(isChecked) => currentTodo && handleCheckTodo(currentTodo, isChecked)}
                  color={StylesGuide.colors.success}
                />
            </View>
            <View style={styles.reminderDueToContainer}>
              {
                !!currentTodo?.reminderOn && (
                  <View style={styles.reminderContainer}>
                    <MaterialIcons
                      name="access-alarm"
                      size={24}
                      color={StylesGuide.colors.dangerLight} 
                    />
                    <Text style={styles.reminderText}>
                      {format(currentTodo.reminderOn, 'hh:mm M/d/yyyy')}
                    </Text>
                  </View>
              )}
              {!!currentTodo?.dueTo && (
                <View style={styles.dueToContainer}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={24}
                    color={StylesGuide.colors.dangerLight}
                  />
                  <Text style={styles.dueToText}>
                    {format(currentTodo.dueTo, 'M/d/yyyy')}
                  </Text>
                </View>
              )}
            </View>
            <ScrollView style={styles.descriptionScrollView}>
              <Text style={styles.descriptionText}>
                {!!currentTodo?.description ? currentTodo.description : 'No description'}
              </Text>
            </ScrollView>
            {
              !!currentTodo?.createdAt && (
              <View style={styles.createdAtContainer}>
                <Text style={styles.createdAtText}>
                  created at: 
                  <Text style={styles.createdAtTextVariant}>
                    {format(currentTodo.createdAt, 'M/dd/yyyy')}
                  </Text>
                </Text>
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