import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  args: {
    placeholder: 'Type here',
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#0E003A', padding: 32, width: 360 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: 'Prepare presentation',
  },
};

export const Password: Story = {
  args: {
    defaultValue: 'correct-horse-battery-staple',
    placeholder: 'Password',
    secureTextEntry: true,
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'This field is required',
  },
};

export const ContrastError: Story = {
  args: {
    contrast: true,
    errorMessage: 'Use at least eight characters',
  },
};
