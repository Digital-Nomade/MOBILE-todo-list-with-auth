import { TodoViewModel } from '@/types/todo-types'

/** Case-insensitive match on title and description; includes done and undone todos. */
export function filterTodosByQuery(
  todos: TodoViewModel[],
  query: string,
): TodoViewModel[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return []
  }

  return todos.filter(todo => {
    const title = todo.title.toLowerCase()
    const description = (todo.description ?? '').toLowerCase()

    return title.includes(normalized) || description.includes(normalized)
  })
}
