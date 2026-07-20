import type { ToDoNotifications } from '@/types/notificaitons-types';
import type { Todo } from '@/types/todo-types';

export const todosFixture: Todo[] = [
  {
    id: '018f6d7e-8b90-7b32-a482-9f831d6e1011',
    title: 'Prepare Storybook review',
    description: 'Review every component state with the product and engineering teams.',
    done: false,
    dueTo: '2026-07-20T18:00:00.000Z',
    reminderOn: '2026-07-20T14:00:00.000Z',
    createdAt: '2026-07-10T09:30:00.000Z',
    updatedAt: '2026-07-15T12:00:00.000Z',
  },
  {
    id: '018f6d7e-8b90-7b32-a482-9f831d6e2022',
    title: 'Publish mobile release notes',
    description: '',
    done: true,
    dueTo: null,
    reminderOn: null,
    createdAt: '2026-07-11T10:00:00.000Z',
    updatedAt: '2026-07-15T13:00:00.000Z',
  },
];

export const notificationsFixture: ToDoNotifications[] = [
  {
    id: '018f6d7e-8b90-7b32-a482-9f831d6e3033',
    todoId: todosFixture[0].id,
    todoTitle: todosFixture[0].title,
    isViewed: false,
  },
  {
    id: '018f6d7e-8b90-7b32-a482-9f831d6e4044',
    todoId: todosFixture[1].id,
    todoTitle: todosFixture[1].title,
    isViewed: true,
  },
];
