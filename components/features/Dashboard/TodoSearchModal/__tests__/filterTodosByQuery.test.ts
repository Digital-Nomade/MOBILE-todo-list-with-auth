import { filterTodosByQuery } from '@/components/features/Dashboard/TodoSearchModal/filterTodosByQuery'
import { TodoViewModel } from '@/types/todo-types'

function createTodo(
  index: number,
  overrides: Partial<TodoViewModel> & Pick<TodoViewModel, 'title'>,
): TodoViewModel {
  return {
    id: `local-${index}`,
    localId: `local-${index}`,
    serverId: `server-${index}`,
    description: overrides.description ?? '',
    done: overrides.done ?? false,
    dueTo: null,
    reminderOn: null,
    createdAt: '2026-07-10T09:30:00.000Z',
    updatedAt: '2026-07-10T09:30:00.000Z',
    syncStatus: 'synced',
    ...overrides,
  }
}

describe('filterTodosByQuery', () => {
  const todos = [
    createTodo(1, { title: 'Buy groceries', description: 'Milk and eggs' }),
    createTodo(2, { title: 'Fix toilet', description: 'Plumber visit', done: true }),
    createTodo(3, { title: 'Paint floor', description: 'Living room refresh' }),
  ]

  it('returns no results for an empty query', () => {
    expect(filterTodosByQuery(todos, '')).toEqual([])
    expect(filterTodosByQuery(todos, '   ')).toEqual([])
  })

  it('matches todos by title case-insensitively', () => {
    expect(filterTodosByQuery(todos, 'buy')).toHaveLength(1)
    expect(filterTodosByQuery(todos, 'BUY')).toHaveLength(1)
  })

  it('matches todos by description', () => {
    expect(filterTodosByQuery(todos, 'plumber')).toHaveLength(1)
  })

  it('includes both done and undone todos', () => {
    const results = filterTodosByQuery(todos, 'fix')
    expect(results).toHaveLength(1)
    expect(results[0]?.done).toBe(true)
  })
})
