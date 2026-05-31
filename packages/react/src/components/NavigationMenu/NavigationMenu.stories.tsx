import type { Meta, StoryObj } from '@storybook/react';
import { NavigationMenu } from './NavigationMenu';

const meta: Meta<typeof NavigationMenu> = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { href: '/', label: 'Home', isCurrent: true },
  { href: '/poetry', label: 'Poetry' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
];

export const Default: Story = {
  args: { items },
};

export const Narrow: Story = {
  args: { items },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const VeryNarrow: Story = {
  args: { items },
  decorators: [
    (Story) => (
      <div style={{ width: 60 }}>
        <Story />
      </div>
    ),
  ],
};
