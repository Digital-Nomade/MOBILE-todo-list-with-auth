import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { SkeletonList } from './SkeletonList';

const meta = {
  title: 'Atoms/SkeletonList',
  component: SkeletonList,
  args: {
    lines: 4,
  },
  argTypes: {
    lines: { control: { type: 'range', min: 1, max: 10, step: 1 } },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 360 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SkeletonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomColors: Story = {
  args: {
    colors: ['#EEB0B4', '#BF0066'],
    lines: 6,
  },
};
