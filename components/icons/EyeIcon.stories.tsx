import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { EyeIcon } from './EyeIcon';

const meta = {
  title: 'Icons/EyeIcon',
  component: EyeIcon,
} satisfies Meta<typeof EyeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
