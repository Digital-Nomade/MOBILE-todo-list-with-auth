import { TodoItem } from "@/components/features/Dashboard/TodoItem/TodoItem";
import { TodoSearchModal } from "@/components/features/Dashboard/TodoSearchModal/TodoSearchModal";
import { TodoSyncStatusBanner } from "@/components/features/TodoSyncStatusBanner/TodoSyncStatusBanner";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { useOfflineTodoMutations, useOfflineTodos } from "@/features/todos/offline/hooks";
import { TodoViewModel } from "@/types/todo-types";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FlatList, RefreshControl } from "react-native-gesture-handler";

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const { data, isLoading, isFetching, refetch, syncState } = useOfflineTodos()
  const { updateTodo } = useOfflineTodoMutations()
  const [todos, setTodos] = useState<TodoViewModel[]>([])

  useEffect(() => {
    setTodos(data ?? [])
  }, [data])

  async function handleCheckSubmit(todoId: string, isChecked: boolean) {
    try {
      await updateTodo({ id: todoId, done: isChecked })
    } catch {
      // local state remains authoritative until sync completes
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const isInitialLoading = (isLoading || isFetching) && todos.length === 0
  const hasTodos = todos.length > 0

  return (
    <GlobalWrapper>
      <TodoSyncStatusBanner syncState={syncState} />
      <Pressable
        testID="dashboard-search-button"
        onPress={() => setSearchVisible(true)}
        style={{
          borderWidth: 1,
          borderColor: StylesGuide.colors.dangerLight,
          padding: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: '#FFFFFFaa', fontSize: StylesGuide.fontSizes.md }}>
          search to do...
        </Text>
        <SimpleLineIcons
          name="magnifier"
          size={20}
          color={StylesGuide.colors.dangerLight}
        />
      </Pressable>

      {isInitialLoading ? (
        <ActivityIndicator
          style={{ marginTop: 48 }}
          color={StylesGuide.colors.dangerLight}
          size="large"
        />
      ) : !hasTodos ? (
        <View
          testID="dashboard-empty-state"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
            marginTop: 48,
          }}
        >
          <Text
            style={{
              color: StylesGuide.colors.white,
              fontSize: StylesGuide.fontSizes.xl,
              fontWeight: 300,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            No todos yet
          </Text>
          <Text
            style={{
              color: StylesGuide.colors.white,
              fontSize: StylesGuide.fontSizes.md,
              fontWeight: 200,
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            Your todos will appear here once you create them.
          </Text>
        </View>
      ) : (
        <FlatList
          style={{ paddingTop: 48 }}
          data={todos}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[StylesGuide.colors.primaryTransparency]}
              tintColor={StylesGuide.colors.primaryTransparency}
            />
          }
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onCheck={handleCheckSubmit}
              isChecked={!!item.done}
            />
          )}
        />
      )}

      <TodoSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onCheck={handleCheckSubmit}
      />
    </GlobalWrapper>
  )
}
