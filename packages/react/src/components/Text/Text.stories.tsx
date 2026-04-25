import type { Meta, StoryObj } from '@storybook/react';
import type { FontFamily, FontSize, FontWeight, LineHeightDensity } from './getTextClassNames';
import { Text } from './Text';

const fontSizeOptions = [
  '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', 'default',
] as const satisfies readonly FontSize[];

const fontWeightOptions = ['normal', 'bold', 'default'] as const satisfies readonly FontWeight[];

const fontFamilyOptions = [
  'sansSerif', 'monospace', 'default',
] as const satisfies readonly FontFamily[];

const lineHeightOptions = [
  'dense', 'normal', 'comfort', 'inherit', 'default',
] as const satisfies readonly (LineHeightDensity | 'inherit' | 'default')[];

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  tags: ['autodocs'],
  args: {
    fontSize: 'default',
    fontWeight: 'default',
    fontFamily: 'default',
    lineHeight: 'default',
    as: 'span',
    children:
      'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
  },
  argTypes: {
    fontSize: { control: { type: 'radio' }, options: fontSizeOptions },
    fontWeight: { control: { type: 'radio' }, options: fontWeightOptions },
    fontFamily: { control: { type: 'radio' }, options: fontFamilyOptions },
    lineHeight: { control: { type: 'radio' }, options: lineHeightOptions },
    as: { control: { type: 'select' } },
    children: { control: { type: 'text' } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
