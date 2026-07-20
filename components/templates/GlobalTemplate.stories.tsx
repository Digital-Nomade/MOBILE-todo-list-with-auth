import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { GlobalWrapper } from './GlobalTemplate';

const meta = {
  title: 'Templates/GlobalWrapper',
  component: GlobalWrapper,
  args: {
    children: (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Application content</Text>
        <Text style={{ color: '#EEB0B4', marginTop: 8 }}>
          Shared gradient and safe-area wrapper
        </Text>
      </View>
    ),
  },
  decorators: [
    (Story) => (
      <View style={{ height: 640, width: 360 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof GlobalWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
