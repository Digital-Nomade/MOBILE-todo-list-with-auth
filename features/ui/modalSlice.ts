import { createSlice } from '@reduxjs/toolkit'

export type ActiveModal = 'addTodo' | null

interface UiState {
  activeModal: ActiveModal
}

const initialState: UiState = {
  activeModal: null,
}

const modalSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddTodoModal(state) {
      state.activeModal = 'addTodo'
    },
    closeModal(state) {
      state.activeModal = null
    },
  },
})

export const { openAddTodoModal, closeModal } = modalSlice.actions
export default modalSlice.reducer
