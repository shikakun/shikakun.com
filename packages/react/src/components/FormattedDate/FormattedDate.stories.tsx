import type { Meta, StoryObj } from '@storybook/react';
import { FormattedDate } from './FormattedDate';

const meta: Meta<typeof FormattedDate> = {
  component: FormattedDate,
  title: 'Components/FormattedDate',
  tags: ['autodocs'],
  argTypes: {
    date: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormattedDate>;

export const FullDateAndTime: Story = {
  args: {
    date: '2026-04-23 15:06',
  },
};

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
