import { TodoItem } from "@/components/features/Dashboard/TodoItem/TodoItem";
import { GlobalWrapper } from "@/components/templates/GlobalTemplate";
import { StylesGuide } from "@/constants/StyleGuide";
import { useFetchTodosQuery } from "@/features/todos/todoApi";
import { useDebouncer } from "@/hooks/useDebouncer";
import { Todo } from "@/types/todo-types";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { FlatList, RefreshControl, TextInput } from "react-native-gesture-handler";

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedValue = useDebouncer(query, 800)
  const [loading, setLoading] = useState(false)
  const { data, isLoading, isFetching, refetch } = useFetchTodosQuery()
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    if (query && debouncedValue) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 1000)
      // TODO: Fetch data
    }
  }, [debouncedValue])

  useEffect(() => {
    if (data?.data.length) {
      setTodos(data.data)
    }
  }, [todos])

  function handleCheckSubmit(todoId: string, isChecked: boolean) {
    
  }

  function onRefresh() {
    setRefreshing(true)
    try {
      refetch()
    } catch(error: any) {

    }
  }

  function renderInputAction() {
    if (loading) {
      return (
        <ActivityIndicator color={StylesGuide.colors.dangerLight}/>
      )
    } else if (!loading && !!query) {
      return (
        <Pressable onPress={() => setQuery('')}>
          <MaterialCommunityIcons name="close-circle" size={24} color={StylesGuide.colors.dangerLight} />
        </Pressable>
      )
    } else {
      return (
        <SimpleLineIcons
          name="magnifier"
          size={20}
          color={StylesGuide.colors.dangerLight}
        />
      )
    }
  }

  return (
    <GlobalWrapper>
      <View style={{ position: 'relative', }}>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: StylesGuide.colors.dangerLight,
            padding: 8,
            borderRadius: 12,
            paddingRight: 32,
            color: StylesGuide.colors.dangerLight
          }}
          placeholder="search to do..."
          placeholderTextColor='#FFFFFFaa'
          onChangeText={(text) => setQuery(text)}
          value={query}
        />
        <View style={{ position: 'absolute', right: 8, top: 6 }}>
          {renderInputAction()}
        </View>
      </View>
      <FlatList
        style={{ paddingTop: 48 }}
        data={todos}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[StylesGuide.colors.primaryTransparency]}
            tintColor={StylesGuide.colors.primaryTransparency}
          />
        }
        renderItem={(data) => (
          <TodoItem
            todo={data.item}
            onCheck={handleCheckSubmit}
            isChecked={!!data.item.done}
          />
        )}
      />
    </GlobalWrapper>
  )
}
