import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { SkeletonTodoForm } from './SkeletonTodoForm';

const meta = {
  title: 'Atoms/SkeletonTodoForm',
  component: SkeletonTodoForm,
  decorators: [
    (Story) => (
      <View style={{ width: 360 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SkeletonTodoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
