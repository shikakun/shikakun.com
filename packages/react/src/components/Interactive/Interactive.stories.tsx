import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { sectionStyle, stackStyle } from '../../storyHelpers';
import { Text } from '../Text';
import type { InteractiveColor } from './Interactive';
import { Interactive } from './Interactive';

type InteractiveDemoProps = {
  as?: 'div' | 'button' | 'a';
  color?: InteractiveColor;
  children?: string;
};

const demoStyle: CSSProperties = {
  color: 'unset',
  background: 'unset',
  border: 'unset',
  textDecoration: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16rem',
  height: '6rem',
};

const InteractiveDemo = ({
  as: asElement = 'button',
  color = 'neutral',
  children = 'Interactive Element',
}: InteractiveDemoProps) => (
  <Interactive
    as={asElement}
    color={color}
    style={demoStyle}
    {...(asElement === 'a' ? { href: '#' } : {})}
  >
    <Text>{children}</Text>
  </Interactive>
);

const colors = ['neutral', 'primary', 'informative', 'negative'] as const;
const elements = ['div', 'button', 'a'] as const;

const meta: Meta<typeof InteractiveDemo> = {
  title: 'Components/Interactive',
  component: InteractiveDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'hover・active・focus のインタラクション表示を提供するユーティリティコンポーネントです。`as` prop で任意の HTML 要素として描画できます。`color` prop でオーバーレイとフォーカスリングの色を指定します。Button や PageList の内部実装で使われています。',
      },
    },
  },
  argTypes: {
    as: {
      control: 'radio',
      options: elements,
      description: '描画する HTML 要素',
    },
    color: {
      control: 'radio',
      options: colors,
      description: 'オーバーレイとフォーカスリングの色',
    },
    children: {
      control: 'text',
      description: 'コンテンツ',
    },
  },
  args: {
    as: 'button',
    color: 'neutral',
    children: 'Interactive Element',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Colors: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={stackStyle}>
      {colors.map((color) => (
        <div key={color} style={sectionStyle}>
          <Text as="h1">{`color: ${color}`}</Text>
          <InteractiveDemo {...args} color={color}>
            Interactive Element
          </InteractiveDemo>
        </div>
      ))}
    </div>
  ),
};

export const Elements: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={stackStyle}>
      {elements.map((element) => (
        <div key={element} style={sectionStyle}>
          <Text as="h1">{`as: ${element}`}</Text>
          <InteractiveDemo {...args} as={element}>
            Interactive Element
          </InteractiveDemo>
        </div>
      ))}
    </div>
  ),
};
