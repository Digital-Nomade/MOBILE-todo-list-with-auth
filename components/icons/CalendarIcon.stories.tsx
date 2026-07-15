import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { CalendarIcon } from './CalendarIcon';

const meta = {
  title: 'Icons/CalendarIcon',
  component: CalendarIcon,
} satisfies Meta<typeof CalendarIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
