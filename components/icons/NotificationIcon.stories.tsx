import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { NotificationIcon } from './NotificationIcon';

const meta = {
  title: 'Icons/NotificationIcon',
  component: NotificationIcon,
  args: {
    hasNotification: false,
  },
} satisfies Meta<typeof NotificationIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Read: Story = {};

export const Unread: Story = {
  args: {
    hasNotification: true,
  },
};
