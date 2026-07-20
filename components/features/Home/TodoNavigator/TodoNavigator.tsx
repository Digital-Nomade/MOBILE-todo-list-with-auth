import { CheckBox } from "@/components/atoms";
import { TodoSyncStatusBanner } from "@/components/features/TodoSyncStatusBanner/TodoSyncStatusBanner";
import { StylesGuide } from "@/constants/StyleGuide";
import { useOfflineTodoMutations, useOfflineTodos } from "@/features/todos/offline/hooks";
import { TodoViewModel } from "@/types/todo-types";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { AnimatePresence, MotiView } from 'moti';
import { Fragment, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { styles } from './TodoNavigator.styles';


type Directions = 'next' | 'previous'

function clampTodoIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.min(Math.max(index, 0), total - 1)
}

export function TodoNavigator() {
  const { data, isLoading, isFetching, syncState } = useOfflineTodos()
  const { updateTodo } = useOfflineTodoMutations()
  const [loading, setLoading] = useState(isLoading || isFetching)
  const [todos, setTodos] = useState<TodoViewModel[]>([])
  const [todoIndex, setTodoIndex] = useState(0)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setTodos(data ?? [])
  }, [data])

  useEffect(() => {
    setTodoIndex(currentIndex => clampTodoIndex(currentIndex, data?.length ?? 0))
  }, [data?.length])

  useEffect(() => {
    setLoading(isLoading || isFetching)
  }, [isLoading, isFetching])

  const hasTodos = todos.length > 0
  const hasMultipleTodos = todos.length > 1
  const hasPrevious = hasMultipleTodos && todoIndex > 0
  const hasNext = hasMultipleTodos && todoIndex < todos.length - 1

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
    if (!hasNext) {
      return
    }

    setTodoIndex(state => clampTodoIndex(state + 1, todos.length))
  }

  function handlePreviousTodo() {
    if (!hasPrevious) {
      return
    }

    setTodoIndex(state => clampTodoIndex(state - 1, todos.length))
  }

  function animateTransition(callback: () => void) {
    setAnimate(true)

    setTimeout(() => {
      callback()
      setAnimate(false)
    }, 200)
  }

  async function handleCheckTodo(todo: TodoViewModel, isChecked: boolean) {
    try {
      await updateTodo({ id: todo.id, done: isChecked })
    } catch {
      // local store remains authoritative until sync completes
    }
  }

  const currentTodo = useMemo(
    () => (hasTodos ? todos[todoIndex] : undefined),
    [hasTodos, todoIndex, todos],
  )

  return (
    <Fragment>
      <TodoSyncStatusBanner syncState={syncState} />
      {loading
        ? <ActivityIndicator
            style={styles.activityIndicator}
            size={'large'}
          />
        : !hasTodos
          ? (
            <View style={styles.emptyStateContainer} testID="todo-navigator-empty">
              <Text style={styles.emptyStateTitle}>No todos yet</Text>
              <Text style={styles.emptyStateDescription}>
                Tap the plus button above to create your first todo.
              </Text>
            </View>
          )
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
                <Text style={styles.titleText} testID="todo-navigator-title">
                  {currentTodo?.title ?? ''}
                </Text>
                <CheckBox
                  checked={currentTodo?.done ?? false}
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

      <View style={styles.navigationContainer}>
        <Pressable
          testID="todo-navigator-previous"
          accessibilityState={{ disabled: !hasPrevious }}
          style={{ opacity: hasPrevious ? 1 : 0.5 }}
          onPress={() => animateTransition(() => handleNavigateTodo('previous'))}
          disabled={!hasPrevious}
        >
          <MaterialIcons
            name="chevron-left"
            size={48}
            color={StylesGuide.colors.dangerLight}
          />
        </Pressable>
        <Pressable
          testID="todo-navigator-next"
          accessibilityState={{ disabled: !hasNext }}
          style={{ opacity: hasNext ? 1 : 0.5 }}
          onPress={() => animateTransition(() => handleNavigateTodo('next'))}
          disabled={!hasNext}
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
