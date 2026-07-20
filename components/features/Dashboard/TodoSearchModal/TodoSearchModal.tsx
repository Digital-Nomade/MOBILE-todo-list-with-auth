import { TodoItem } from '@/components/features/Dashboard/TodoItem/TodoItem'
import { StylesGuide } from '@/constants/StyleGuide'
import { useTodoSearch } from '@/features/todos/offline/hooks'
import { useDebouncer } from '@/hooks/useDebouncer'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { styles } from './TodoSearchModal.styles'

interface TodoSearchModalProps {
  visible: boolean
  onClose: () => void
  onCheck: (todoId: string, isChecked: boolean) => void
}

export function TodoSearchModal({
  visible,
  onClose,
  onCheck,
}: TodoSearchModalProps) {
  const inputRef = useRef<TextInput>(null)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncer(query, 700)
  const {
    results,
    isSearching,
    isLocalSearch,
    searchError,
  } = useTodoSearch(debouncedQuery)

  useEffect(() => {
    if (!visible) {
      setQuery('')
      return
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    return () => clearTimeout(focusTimer)
  }, [visible])

  const hasQuery = debouncedQuery.trim().length > 0
  const showNoResults =
    hasQuery && !isSearching && !searchError && results.length === 0

  function handleClose() {
    setQuery('')
    onClose()
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop} testID="todo-search-modal">
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Search todos</Text>
            <Pressable onPress={handleClose} testID="todo-search-close">
              <Text style={styles.closeButton}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              ref={inputRef}
              testID="todo-search-input"
              style={styles.searchInput}
              placeholder="search to do..."
              placeholderTextColor="#FFFFFFaa"
              autoFocus
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <View style={styles.searchActions}>
              {isSearching ? (
                <ActivityIndicator
                  size="small"
                  color={StylesGuide.colors.dangerLight}
                  testID="todo-search-loading"
                />
              ) : query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  testID="todo-search-clear"
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color={StylesGuide.colors.dangerLight}
                  />
                </Pressable>
              ) : (
                <SimpleLineIcons
                  name="magnifier"
                  size={20}
                  color={StylesGuide.colors.dangerLight}
                />
              )}
            </View>
          </View>

          {!hasQuery ? (
            <View style={styles.emptyStateContainer} testID="todo-search-prompt">
              <Text style={styles.emptyStateTitle}>Search your todos</Text>
              <Text style={styles.emptyStateDescription}>
                Type a title or description keyword to find done and undone todos.
              </Text>
            </View>
          ) : searchError ? (
            <View style={styles.emptyStateContainer} testID="todo-search-error">
              <Text style={styles.emptyStateTitle}>Search unavailable</Text>
              <Text style={styles.emptyStateDescription}>{searchError}</Text>
            </View>
          ) : showNoResults ? (
            <View style={styles.emptyStateContainer} testID="todo-search-empty">
              <Text style={styles.emptyStateTitle}>Nothing to search</Text>
              <Text style={styles.emptyStateDescription}>
                {isLocalSearch
                  ? 'No matching todos were found in your local list. Try another keyword.'
                  : 'No matching todos were found on the server. Try another keyword.'}
              </Text>
            </View>
          ) : (
            <FlatList
              style={styles.resultsList}
              testID="todo-search-results"
              data={results}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TodoItem
                  todo={item}
                  onCheck={onCheck}
                  isChecked={!!item.done}
                />
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}
