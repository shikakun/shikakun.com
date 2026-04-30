import type { Meta, StoryObj } from '@storybook/react';
import { formatDate } from './formatDate';

const FormatDateExample = ({ input }: { input: string }) => (
  <code>{`formatDate("${input}") → "${formatDate(input)}"`}</code>
);

const meta: Meta<typeof FormatDateExample> = {
  title: 'Utils/formatDate',
  component: FormatDateExample,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '日付または日付と時刻をあらわす文字列を、英語表記へフォーマットします。',
      },
    },
  },
  argTypes: {
    input: {
      control: 'text',
      description:
        '日付または日付と時刻をあらわす文字列。`YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `YYYY-MM-DD HH:MM` のいずれかの形式を受け取ります。',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { input: '2026-04-23 15:06' },
};

export const YearOnly: Story = {
  args: { input: '2026' },
};
YearOnly.storyName = 'YYYY';

export const YearAndMonth: Story = {
  args: { input: '2026-04' },
};
YearAndMonth.storyName = 'YYYY-MM';

export const FullDate: Story = {
  args: { input: '2026-04-23' },
};
FullDate.storyName = 'YYYY-MM-DD';

export const FullDateAndTime: Story = {
  args: { input: '2026-04-23 15:06' },
};
FullDateAndTime.storyName = 'YYYY-MM-DD HH:MM';
