import { Todo } from "@/types/todo-types";

export const mockedData: Todo[] = [
  {
    id: '3f2b8f64-9c1d-4e4a-8f6a-1a2b3c4d5e6f',
    title: 'But new fruits',
    description: '',
    done: false,
    dueTo: new Date().toISOString(),
    reminderOn: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7a1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
    title: 'Fix the toilet',
    description: `There's a problem with the sink and the toilets, buy it!`,
    done: false,
    dueTo: undefined,
    reminderOn: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9e8d7c6b-5a4f-3e2d-1c0b-a9f8e7d6c5b4',
    title: 'Paint the floor',
    description: `Need to buy \n- Pain\n- Brush\n- A new carpet`,
    done: false,
    dueTo: undefined,
    reminderOn: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
