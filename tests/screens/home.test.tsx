import HomeScreen from '@/app/(home)/(main)/index'
import { GlobalTodoModal } from '@/components/features/GlobalTodoModal/GlobalTodoModal'
import { createTestStore } from '@/test-utils'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Provider } from 'react-redux'

jest.mock('@/components/features/Home/TodoNavigator/TodoNavigator', () => ({
  TodoNavigator: () => null,
}))

jest.mock('@/features/todos/offline/hooks', () => ({
  useOfflineTodoMutations: () => ({
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
  }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
  }),
}))

describe('HomeScreen', () => {
  it('opens the global add todo modal from the home add button', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <HomeScreen />
        <GlobalTodoModal />
      </Provider>,
    )

    fireEvent.press(screen.getByTestId('add-todo-button'))

    expect(store.getState().ui.activeModal).toBe('addTodo')
    expect(screen.getByTestId('todo-title-input')).toBeTruthy()
  })
})
