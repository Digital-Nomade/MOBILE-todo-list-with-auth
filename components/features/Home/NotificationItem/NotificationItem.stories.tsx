import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { notificationsFixture } from '@/.storybook/fixtures';

import { NotificationItem } from './NotificationItem';

const meta = {
  title: 'Features/NotificationItem',
  component: NotificationItem,
  args: {
    notification: notificationsFixture[0],
  },
  decorators: [
    (Story) => (
      <View style={{ width: 420 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof NotificationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {};

export const Viewed: Story = {
  args: {
    notification: notificationsFixture[1],
  },
};
