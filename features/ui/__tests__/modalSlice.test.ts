import uiReducer, { closeModal, openAddTodoModal } from '@/features/ui/modalSlice'

describe('modalSlice', () => {
  it('opens the add todo modal', () => {
    const state = uiReducer(undefined, openAddTodoModal())

    expect(state.activeModal).toBe('addTodo')
  })

  it('closes the active modal', () => {
    let state = uiReducer(undefined, openAddTodoModal())

    state = uiReducer(state, closeModal())

    expect(state.activeModal).toBeNull()
  })
})
