import { GlobalTodoModal } from '@/components/features/GlobalTodoModal/GlobalTodoModal'
import { closeModal, openAddTodoModal } from '@/features/ui/modalSlice'
import { createTestStore } from '@/test-utils'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'

jest.mock('@/components/organisms/TodoModal/TodoDetails', () => ({
  TodoDetails: ({ onClose }: { onClose?: () => void }) => {
    const { Pressable, Text, View } = require('react-native')

    return (
      <View>
        <Pressable testID="todo-save-button" onPress={() => onClose?.()}>
          <Text>Save</Text>
        </Pressable>
        <Pressable testID="todo-cancel-button" onPress={() => onClose?.()}>
          <Text>Cancel</Text>
        </Pressable>
      </View>
    )
  },
}))

describe('GlobalTodoModal', () => {
  function renderModal(store = createTestStore()) {
    return render(
      <Provider store={store}>
        <GlobalTodoModal />
      </Provider>,
    )
  }

  it('is hidden when no modal is active', () => {
    renderModal()

    expect(screen.queryByTestId('todo-save-button')).toBeNull()
  })

  it('shows the add todo form when the modal is open', () => {
    const store = createTestStore()
    store.dispatch(openAddTodoModal())

    renderModal(store)

    expect(screen.getByTestId('global-add-todo-modal')).toBeTruthy()
    expect(screen.getByTestId('todo-save-button')).toBeTruthy()
  })

  it('closes from the Done button', () => {
    const store = createTestStore()
    store.dispatch(openAddTodoModal())

    renderModal(store)

    fireEvent.press(screen.getByTestId('global-add-todo-done'))

    expect(store.getState().ui.activeModal).toBeNull()
  })

  it('closes from cancel in TodoDetails', () => {
    const store = createTestStore()
    store.dispatch(openAddTodoModal())

    renderModal(store)

    fireEvent.press(screen.getByTestId('todo-cancel-button'))
    expect(store.getState().ui.activeModal).toBeNull()
  })

  it('closes from save in TodoDetails', async () => {
    const store = createTestStore()
    store.dispatch(openAddTodoModal())

    renderModal(store)

    fireEvent.press(screen.getByTestId('todo-save-button'))

    await waitFor(() => {
      expect(store.getState().ui.activeModal).toBeNull()
    })
  })

  it('can be closed programmatically through redux', () => {
    const store = createTestStore()
    store.dispatch(openAddTodoModal())

    renderModal(store)

    store.dispatch(closeModal())

    expect(store.getState().ui.activeModal).toBeNull()
  })
})
