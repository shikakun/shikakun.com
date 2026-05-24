import type { Meta, StoryObj } from '@storybook/react';
import { PageList } from './PageList';

const meta = {
  title: 'Components/PageList',
  component: PageList,
  tags: ['autodocs'],
  args: {
    items: [
      { href: '#', title: 'ポラーノの広場', date: '2026-05-24 10:33' },
      { href: '#', title: '銀河鉄道の夜', date: '2026-05-24' },
      { href: '#', title: '風の又三郎', date: '2026-05' },
      {
        href: '#',
        title:
          'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
        date: '2026',
      },
      { href: '#', title: '注文の多い料理店' },
    ],
    titleLineClamp: false,
  },
  argTypes: {
    titleLineClamp: {
      control: { type: 'radio' },
      options: [false, 1, 3],
    },
  },
} satisfies Meta<typeof PageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
