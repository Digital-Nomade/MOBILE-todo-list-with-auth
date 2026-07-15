import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { TabBarIcon } from './TabBarIcon';

const meta = {
  title: 'Navigation/TabBarIcon',
  component: TabBarIcon,
  args: {
    color: '#BF0066',
    name: 'home',
  },
  argTypes: {
    color: { control: 'color' },
    name: {
      control: 'select',
      options: ['home', 'home-outline', 'list', 'list-outline', 'person', 'person-outline'],
    },
  },
} satisfies Meta<typeof TabBarIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inactive: Story = {
  args: {
    color: '#EEB0B4',
    name: 'home-outline',
  },
};
