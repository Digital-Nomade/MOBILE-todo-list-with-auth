import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { todosFixture } from '@/.storybook/fixtures';

import { TodoDetails } from './TodoDetails';

const meta = {
  title: 'Organisms/TodoDetails',
  component: TodoDetails,
  args: {
    isEditing: false,
    showCancel: true,
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#0E003A', minHeight: 640, padding: 32, width: 460 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TodoDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};

export const CreateWithoutCancel: Story = {
  args: {
    showCancel: false,
  },
};

export const Edit: Story = {
  args: {
    isEditing: true,
    todo: {
      ...todosFixture[0],
      localId: todosFixture[0].id,
      serverId: todosFixture[0].id,
      syncStatus: 'synced',
    },
  },
};
