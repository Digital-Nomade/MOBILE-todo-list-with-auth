/** Backend Todo. IDs are UUID strings; DateTime fields are ISO-8601 strings. */
export interface Todo {
  id: string
  title: string
  description: string
  done: boolean
  dueTo?: string | null
  reminderOn?: string | null
  createdAt: string
  updatedAt: string
}

export type TodoOrder = 'ASC' | 'DESC'

export interface TodoPaginationInput {
  currentPage?: number
  limit?: number
  orderBy?: TodoOrder
  total?: boolean
}

export interface PaginatedTodos {
  data: Todo[]
  first: number
  last: number
  limit: number
  total?: number | null
}

export interface TodoCreationPayload {
  title: string
  description: string
  dueTo?: Date
  reminderOn?: Date
}

export interface TodoUpdatePayload {
  id: string
  title?: string
  description?: string
  done?: boolean
  dueTo?: Date | string | null
  reminderOn?: Date | string | null
}
