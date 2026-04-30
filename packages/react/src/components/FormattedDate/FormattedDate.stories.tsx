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

export const Default: Story = {
  args: {
    date: '2026-04-23 15:06',
  },
};

export const YearOnly: Story = {
  args: {
    date: '2026',
  },
};
YearOnly.storyName = 'YYYY';

export const YearAndMonth: Story = {
  args: {
    date: '2026-04',
  },
};
YearAndMonth.storyName = 'YYYY-MM';

export const FullDate: Story = {
  args: {
    date: '2026-04-23',
  },
};
FullDate.storyName = 'YYYY-MM-DD';

export const FullDateAndTime: Story = {
  args: {
    date: '2026-04-23 15:06',
  },
};
FullDateAndTime.storyName = 'YYYY-MM-DD HH:MM';
