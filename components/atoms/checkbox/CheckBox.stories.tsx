import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { CheckBox } from './CheckBox';

const meta = {
  title: 'Atoms/CheckBox',
  component: CheckBox,
  args: {
    checked: false,
    onCheck: fn(),
  },
  argTypes: {
    color: { control: 'color' },
    size: { control: { type: 'range', min: 24, max: 64, step: 4 } },
  },
} satisfies Meta<typeof CheckBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const CustomAppearance: Story = {
  args: {
    checked: true,
    color: '#BF0066',
    size: 48,
  },
};

function InteractiveCheckBox() {
  const [checked, setChecked] = useState(false);

  return <CheckBox checked={checked} onCheck={setChecked} />;
}

export const Interactive: Story = {
  render: () => <InteractiveCheckBox />,
};
