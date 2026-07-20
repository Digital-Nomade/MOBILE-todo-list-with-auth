const TODO_FIELDS = `
  id
  title
  description
  done
  dueTo
  reminderOn
  createdAt
  updatedAt
`

export const TODOS_QUERY = `
  query Todos($pagination: TodoPaginationInput) {
    todos(pagination: $pagination) {
      data {
        ${TODO_FIELDS}
      }
      first
      last
      limit
      total
    }
  }
`

export const SEARCH_TODOS_QUERY = `
  query SearchTodos($term: String!, $pagination: TodoPaginationInput) {
    searchTodos(term: $term, pagination: $pagination) {
      data {
        ${TODO_FIELDS}
      }
      first
      last
      limit
      total
    }
  }
`

export const TODO_QUERY = `
  query Todo($id: ID!) {
    todo(id: $id) {
      ${TODO_FIELDS}
    }
  }
`

export const CREATE_TODO_MUTATION = `
  mutation CreateTodo($input: CreateTodo!) {
    createTodo(input: $input) {
      ${TODO_FIELDS}
    }
  }
`

export const UPDATE_TODO_MUTATION = `
  mutation UpdateTodo($id: ID!, $input: UpdateTodo!) {
    updateTodo(id: $id, input: $input) {
      ${TODO_FIELDS}
    }
  }
`

export const DELETE_TODO_MUTATION = `
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`
