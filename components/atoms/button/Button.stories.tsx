import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: {
    buttonType: 'primary',
    children: 'Save todo',
    onPress: fn(),
    variant: 'fill',
  },
  argTypes: {
    buttonType: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success', 'alert', 'info'],
    },
    variant: {
      control: 'inline-radio',
      options: ['fill', 'outlined'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
};

export const Rounded: Story = {
  args: {
    rounded: true,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
