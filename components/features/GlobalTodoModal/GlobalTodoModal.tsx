import { TodoDetails } from '@/components/organisms/TodoModal/TodoDetails'
import { GlobalWrapper } from '@/components/templates/GlobalTemplate'
import { useAppDispatch, useAppSelector } from '@/config/redux/hooks'
import { StylesGuide } from '@/constants/StyleGuide'
import { closeModal } from '@/features/ui/modalSlice'
import { Modal, Pressable, Text, View } from 'react-native'

export function GlobalTodoModal() {
  const dispatch = useAppDispatch()
  const activeModal = useAppSelector(state => state.ui.activeModal)
  const visible = activeModal === 'addTodo'

  function handleClose() {
    dispatch(closeModal())
  }

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={handleClose}
      testID="global-add-todo-modal"
    >
      <GlobalWrapper>
        <View style={{ position: 'relative', flex: 1 }}>
          <View
            style={{
              height: 2,
              width: 200,
              backgroundColor: StylesGuide.colors.dangerLight,
              borderRadius: 12,
              marginHorizontal: 'auto',
              marginBottom: 40,
            }}
          />
          <Pressable
            testID="global-add-todo-done"
            style={{ position: 'absolute', right: 0, top: -8 }}
            onPress={handleClose}
          >
            <Text style={{ color: StylesGuide.colors.dangerLight }}>Done</Text>
          </Pressable>
          <TodoDetails onClose={handleClose} />
        </View>
      </GlobalWrapper>
    </Modal>
  )
}
