import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import {
  resetTodoQueryState,
  setTodoQueryState,
} from '@/.storybook/mocks/todo-api';

import { TodoNavigator } from './TodoNavigator';

const meta = {
  title: 'Features/TodoNavigator',
  component: TodoNavigator,
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#0E003A', height: 440, padding: 24, width: 420 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TodoNavigator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  render: () => {
    resetTodoQueryState();
    return <TodoNavigator />;
  },
};

export const Loading: Story = {
  render: () => {
    setTodoQueryState({ data: undefined, isLoading: true });
    return <TodoNavigator />;
  },
};

export const Empty: Story = {
  render: () => {
    setTodoQueryState({
      data: { data: [], first: 0, last: 0, limit: 10, total: 0 },
    });
    return <TodoNavigator />;
  },
};

export const QueryError: Story = {
  render: () => {
    setTodoQueryState({
      data: undefined,
      error: new Error('Unable to load todos'),
      isError: true,
    });
    return <TodoNavigator />;
  },
};
