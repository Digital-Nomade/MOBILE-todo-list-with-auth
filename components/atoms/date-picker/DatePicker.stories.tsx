import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { DatePicker } from './DatePicker';

const meta = {
  title: 'Atoms/DatePicker',
  component: DatePicker,
  args: {
    mode: 'date',
    onChange: fn(),
    value: new Date('2026-07-15T12:00:00.000Z'),
  },
  argTypes: {
    backgroundColor: { control: 'color' },
    mode: {
      control: 'inline-radio',
      options: ['date', 'datetime', 'time'],
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DateOnly: Story = {};

export const DateAndTime: Story = {
  args: {
    mode: 'datetime',
  },
};

export const Time: Story = {
  args: {
    mode: 'time',
  },
};

export const ConstrainedRange: Story = {
  args: {
    minimumDate: new Date('2026-07-01T00:00:00.000Z'),
    maxDate: new Date('2026-07-31T23:59:59.999Z'),
  },
};
