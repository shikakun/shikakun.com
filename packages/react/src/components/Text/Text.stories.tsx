import type { Meta, StoryObj } from '@storybook/react';
import type { FontFamily, FontSize, FontWeight, LineHeightDensity } from './getTextClassNames';
import { Text } from './Text';

const fontSizeOptions = [
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  'inherit',
] as const satisfies readonly FontSize[];

const fontWeightOptions = ['normal', 'bold', 'inherit'] as const satisfies readonly FontWeight[];

const fontFamilyOptions = [
  'sansSerif',
  'monospace',
  'inherit',
] as const satisfies readonly FontFamily[];

const lineHeightOptions = ['dense', 'normal', 'comfort', 'inherit'] as const satisfies readonly (
  | LineHeightDensity
  | 'inherit'
)[];

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  tags: ['autodocs'],
  args: {
    children:
      'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
    as: 'span',
    fontSize: 'm',
    fontWeight: 'normal',
    fontFamily: 'sansSerif',
    lineHeight: 'normal',
    lineClamp: false,
  },
  argTypes: {
    children: { control: { type: 'text' } },
    as: { control: { type: 'select' } },
    fontSize: { control: { type: 'select' }, options: fontSizeOptions },
    fontWeight: { control: { type: 'radio' }, options: fontWeightOptions },
    fontFamily: { control: { type: 'radio' }, options: fontFamilyOptions },
    lineHeight: { control: { type: 'radio' }, options: lineHeightOptions },
    lineClamp: { control: { type: 'radio' }, options: [false, 1, 3] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
