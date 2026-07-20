import { startTodoChangedSubscription } from '../todoSubscription'

class MockWebSocket {
  static OPEN = 1
  static instances: MockWebSocket[] = []

  readyState = MockWebSocket.OPEN
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  send = jest.fn()

  constructor(
    readonly url: string,
    readonly protocol: string,
  ) {
    MockWebSocket.instances.push(this)
  }

  close = jest.fn(() => {
    this.readyState = 3
    this.onclose?.()
  })

  emit(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
}

describe('todoChanged subscription', () => {
  const originalWebSocket = global.WebSocket

  beforeEach(() => {
    jest.useFakeTimers()
    MockWebSocket.instances = []
    ;(global as typeof globalThis & { WebSocket: unknown }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket
  })

  afterEach(() => {
    jest.useRealTimers()
    global.WebSocket = originalWebSocket
  })

  it('authenticates, subscribes, and forwards todo changes', () => {
    const onTodoChanged = jest.fn()
    const onConnected = jest.fn()
    const stop = startTodoChangedSubscription({
      getAccessToken: () => 'access-1',
      onConnected,
      onTodoChanged,
    })
    const socket = MockWebSocket.instances[0]

    expect(socket.protocol).toBe('graphql-transport-ws')
    socket.onopen?.()
    expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({
      type: 'connection_init',
      payload: { Authorization: 'Bearer access-1' },
    })

    socket.emit({ type: 'connection_ack' })
    expect(onConnected).toHaveBeenCalledWith(false)
    expect(JSON.parse(socket.send.mock.calls[1][0])).toMatchObject({
      id: 'todo-changed',
      type: 'subscribe',
    })

    const change = {
      type: 'DELETED',
      todoId: 'todo-1',
      occurredAt: '2026-07-20T20:00:00.000Z',
      todo: null,
    }
    socket.emit({
      id: 'todo-changed',
      type: 'next',
      payload: { data: { todoChanged: change } },
    })
    expect(onTodoChanged).toHaveBeenCalledWith(change)

    stop()
    expect(JSON.parse(socket.send.mock.calls[2][0])).toEqual({
      id: 'todo-changed',
      type: 'complete',
    })
  })

  it('reconnects with the latest access token', () => {
    let token = 'access-1'
    const onConnected = jest.fn()
    const stop = startTodoChangedSubscription({
      getAccessToken: () => token,
      onConnected,
      onTodoChanged: jest.fn(),
      retryDelayMs: 10,
    })

    const first = MockWebSocket.instances[0]
    first.onopen?.()
    first.emit({ type: 'connection_ack' })

    token = 'access-2'
    first.close()
    jest.advanceTimersByTime(10)

    const second = MockWebSocket.instances[1]
    second.onopen?.()
    second.emit({ type: 'connection_ack' })

    expect(JSON.parse(second.send.mock.calls[0][0]).payload).toEqual({
      Authorization: 'Bearer access-2',
    })
    expect(onConnected).toHaveBeenLastCalledWith(true)

    stop()
  })
})
