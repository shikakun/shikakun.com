import type { Meta, StoryObj } from '@storybook/react';
import { FormattedDate } from './FormattedDate';

const meta: Meta<typeof FormattedDate> = {
  component: FormattedDate,
  tags: ['autodocs'],
  argTypes: {
    date: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormattedDate>;

export const FullDate: Story = {
  args: {
    date: '2026-04-23',
  },
};

export const YearAndMonth: Story = {
  args: {
    date: '2026-04',
  },
};

export const YearOnly: Story = {
  args: {
    date: '2026',
  },
};
