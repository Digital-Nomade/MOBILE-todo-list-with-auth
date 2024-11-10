import { api } from "@/config/redux/api";
import { Todo, TodoCreationPayload, TodoRequestPayloadWithPagination } from "@/types/todo-types";

const todoApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: build => ({
    fetchTodos: build.query<TodoRequestPayloadWithPagination, void>({
      query: () => ({
        url: '/todo',
        method: 'GET',
      }),
      providesTags: ['todos']
    }),
    createTodo: build.mutation({
      query: (todo: TodoCreationPayload) => ({
        url: '/todo',
        method: 'POST',
        body: { ...todo },
      }),
      invalidatesTags: ['todos'],
    }),
    updateTodo: build.mutation({
      query: (todo: Todo) => ({
        url: `/todo/${todo.id}`,
        method: 'PATCH',
        body: { ...todo },
      }),
      invalidatesTags: ['todos'],
    })
  })
})

export const {
  useFetchTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
} = todoApi
