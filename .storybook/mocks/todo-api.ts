import type { PaginatedTodos } from '@/types/todo-types';

import { todosFixture } from '../fixtures';

interface TodoQueryState {
  data?: PaginatedTodos;
  error?: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
}

const initialQueryState: TodoQueryState = {
  data: {
    data: todosFixture,
    first: 1,
    last: todosFixture.length,
    limit: 10,
    total: todosFixture.length,
  },
  isError: false,
  isFetching: false,
  isLoading: false,
};

let queryState = initialQueryState;

export function setTodoQueryState(state: Partial<TodoQueryState>) {
  queryState = { ...initialQueryState, ...state };
}

export function resetTodoQueryState() {
  queryState = initialQueryState;
}

export function useFetchTodosQuery() {
  return queryState;
}

function createMutationResult() {
  return {
    unwrap: async () => undefined,
  };
}

export function useCreateTodoMutation() {
  return [createMutationResult, { isLoading: false }] as const;
}

export function useUpdateTodoMutation() {
  return [createMutationResult, { isLoading: false }] as const;
}
