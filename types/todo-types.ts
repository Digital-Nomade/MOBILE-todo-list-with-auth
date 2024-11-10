export interface Todo {
  id: string
  title: string
  description: string
  done: boolean
  dueTo?: Date
  reminderOn?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TodoRequestPayloadWithPagination {
  first: number
  last: number
  limit: number
  data: Todo[]
}

export interface TodoCreationPayload {
  title: string
  description: string
  dueTo?: Date
  reminderOn?: Date
}