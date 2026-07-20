import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { HeaderBackButton } from './HeaderBackButton';

const meta = {
  title: 'Atoms/HeaderBackButton',
  component: HeaderBackButton,
  args: {
    color: '#0E003A',
    label: 'Back',
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof HeaderBackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Light: Story = {
  args: {
    color: '#FFFFFF',
    label: 'Todos',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
