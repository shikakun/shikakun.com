import type { Meta, StoryObj } from '@storybook/react';
import { capitalize } from './capitalize';

const CapitalizeExample = ({ input }: { input: string }) => (
  <code>{`capitalize("${input}") → "${capitalize(input)}"`}</code>
);

const meta: Meta<typeof CapitalizeExample> = {
  title: 'Utils/capitalize',
  component: CapitalizeExample,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '半角英数の文字列の先頭の1文字目を大文字にします。',
      },
    },
  },
  argTypes: {
    input: { control: 'text', description: '半角英数の文字列' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { input: 'yo' },
};
