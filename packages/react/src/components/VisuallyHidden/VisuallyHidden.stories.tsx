import type { Meta, StoryObj } from '@storybook/react';
import { VisuallyHidden } from './VisuallyHidden';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
  args: {
    as: 'span',
    children: 'サンプルテキスト',
  },
  argTypes: {
    as: { control: { type: 'select' }, options: ['span', 'h1', 'h2', 'h3', 'p'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
