import { TodoSyncListener } from '@/features/todos/TodoSyncListener'
import { reconcileAfterTodoChanged } from '@/features/todos/offline/todoService'
import { startTodoChangedSubscription } from '@/features/todos/todoSubscription'
import { setCredentials } from '@/features/auth/authFlowSlice'
import { authPayloadFixture, createTestStore } from '@/test-utils'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'

jest.mock('@/features/todos/todoSubscription', () => ({
  startTodoChangedSubscription: jest.fn(() => jest.fn()),
}))

jest.mock('@/features/todos/offline/todoService', () => ({
  reconcileAfterTodoChanged: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    user: { id: 'user-1' },
    canUseBackend: true,
  }),
}))

describe('TodoSyncListener', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not start the subscription without an access token', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <TodoSyncListener />
      </Provider>,
    )

    expect(startTodoChangedSubscription).not.toHaveBeenCalled()
  })

  it('starts the todoChanged subscription when backend access is available', () => {
    const store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture()))

    render(
      <Provider store={store}>
        <TodoSyncListener />
      </Provider>,
    )

    expect(startTodoChangedSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        getAccessToken: expect.any(Function),
        onConnected: expect.any(Function),
        onTodoChanged: expect.any(Function),
        onError: expect.any(Function),
      }),
    )
  })

  it('reconciles todos when a subscription event arrives', () => {
    const store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture()))

    render(
      <Provider store={store}>
        <TodoSyncListener />
      </Provider>,
    )

    const options = jest.mocked(startTodoChangedSubscription).mock.calls[0][0]
    const event = {
      type: 'UPDATED' as const,
      todoId: 'todo-1',
      occurredAt: '2026-07-20T12:00:00.000Z',
      todo: {
        id: 'todo-1',
        title: 'Updated',
        description: '',
        done: false,
        dueTo: null,
        reminderOn: null,
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T12:00:00.000Z',
      },
    }

    options.onTodoChanged(event)

    expect(reconcileAfterTodoChanged).toHaveBeenCalledWith(
      expect.any(Function),
      'user-1',
      event,
    )
  })

  it('reconciles on reconnect', () => {
    const store = createTestStore()
    store.dispatch(setCredentials(authPayloadFixture()))

    render(
      <Provider store={store}>
        <TodoSyncListener />
      </Provider>,
    )

    const options = jest.mocked(startTodoChangedSubscription).mock.calls[0][0]
    options.onConnected(true)

    expect(reconcileAfterTodoChanged).toHaveBeenCalledWith(
      expect.any(Function),
      'user-1',
      undefined,
    )
  })
})
