import { Todo } from "@/types/todo-types";

export const mockedData: Todo[] = [
  {
    id: '00000001',
    title: 'But new fruits',
    description: '',
    dueTo: new Date(),
    reminderOn: new Date(),
    isChecked: false,
    createdAt: new Date(),
  },
  {
    id: '00000002',
    title: 'Fix the toilet',
    description: `There's a problem with the sink and the toilets, buy it!`,
    dueTo: undefined,
    reminderOn: new Date(),
    isChecked: false,
    createdAt: new Date(),
  },
  {
    id: '00000003',
    title: 'Paint the floor',
    description: `Need to buy \n- Pain\n- Brush\n- A new carpet`,
    dueTo: undefined,
    reminderOn: undefined,
    isChecked: false,
    createdAt: new Date(),
  },
]