import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PlusIcon } from './PlusIcon';

const meta = {
  title: 'Icons/PlusIcon',
  component: PlusIcon,
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#BF0066', borderRadius: 32, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof PlusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
