import { api } from "@/config/redux/api";
import {
  PaginatedTodos,
  Todo,
  TodoCreationPayload,
  TodoPaginationInput,
  TodoUpdatePayload,
} from "@/types/todo-types";
import {
  CREATE_TODO_MUTATION,
  DELETE_TODO_MUTATION,
  TODO_QUERY,
  TODOS_QUERY,
  UPDATE_TODO_MUTATION,
} from "./documents";

const DEFAULT_PAGINATION: TodoPaginationInput = {
  currentPage: 1,
  limit: 10,
  orderBy: 'DESC',
}

/** DateTime inputs must reach the backend as ISO-8601 strings. */
function toISOString(value: Date | string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) {
    return value
  }

  return value instanceof Date ? value.toISOString() : value
}

const todoApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: build => ({
    fetchTodos: build.query<PaginatedTodos, TodoPaginationInput | void>({
      query: (pagination) => ({
        document: TODOS_QUERY,
        variables: {
          pagination: { ...DEFAULT_PAGINATION, ...(pagination ?? {}) },
        },
      }),
      transformResponse: (data: { todos: PaginatedTodos }) => data.todos,
      providesTags: ['todos']
    }),
    fetchTodo: build.query<Todo, string>({
      query: (id) => ({
        document: TODO_QUERY,
        variables: { id },
      }),
      transformResponse: (data: { todo: Todo }) => data.todo,
      providesTags: ['todos'],
    }),
    createTodo: build.mutation<Todo, TodoCreationPayload>({
      query: (todo) => ({
        document: CREATE_TODO_MUTATION,
        variables: {
          input: {
            title: todo.title,
            description: todo.description,
            dueTo: toISOString(todo.dueTo),
            reminderOn: toISOString(todo.reminderOn),
          },
        },
      }),
      transformResponse: (data: { createTodo: Todo }) => data.createTodo,
      invalidatesTags: ['todos'],
    }),
    updateTodo: build.mutation<Todo, TodoUpdatePayload>({
      query: ({ id, ...input }) => ({
        document: UPDATE_TODO_MUTATION,
        variables: {
          id,
          input: {
            ...input,
            dueTo: toISOString(input.dueTo),
            reminderOn: toISOString(input.reminderOn),
          },
        },
      }),
      transformResponse: (data: { updateTodo: Todo }) => data.updateTodo,
      invalidatesTags: ['todos'],
    }),
    deleteTodo: build.mutation<boolean, string>({
      query: (id) => ({
        document: DELETE_TODO_MUTATION,
        variables: { id },
      }),
      transformResponse: (data: { deleteTodo: boolean }) => data.deleteTodo,
      invalidatesTags: ['todos'],
    }),
  })
})

export const {
  useFetchTodosQuery,
  useFetchTodoQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todoApi
