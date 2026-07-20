import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { todosFixture } from '@/.storybook/fixtures';

import { TodoItem } from './TodoItem';

const meta = {
  title: 'Features/TodoItem',
  component: TodoItem,
  args: {
    isChecked: false,
    onCheck: fn(),
    todo: todosFixture[0],
  },
  decorators: [
    (Story) => (
      <View style={{ width: 420 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TodoItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const Completed: Story = {
  args: {
    isChecked: true,
    todo: todosFixture[1],
  },
};

export const LongTitle: Story = {
  args: {
    todo: {
      ...todosFixture[0],
      title: 'Prepare the complete quarterly engineering presentation',
    },
  },
};
