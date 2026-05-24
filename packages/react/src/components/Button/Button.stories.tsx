import type { Meta, StoryObj } from '@storybook/react';
import {
  LuChevronDown,
  LuChevronRight,
  LuChevronsUpDown,
  LuExternalLink,
  LuFolder,
  LuPlus,
  LuSearch,
} from 'react-icons/lu';
import { rowStyle, sectionStyle, stackStyle } from '../../storyHelpers';
import { Text } from '../Text';
import { Button } from './Button';

const iconOptions = {
  none: undefined,
  chevronRight: <LuChevronRight size={18} />,
  chevronsUpDown: <LuChevronsUpDown size={18} />,
  dropdown: <LuChevronDown size={18} />,
  externalLink: <LuExternalLink size={18} />,
  folder: <LuFolder size={18} />,
  plus: <LuPlus size={18} />,
  search: <LuSearch size={18} />,
};

const appearances = ['text', 'outlined', 'tinted', 'filled'] as const;
const colors = ['primary', 'neutral', 'informative', 'negative'] as const;
const sizes = ['s', 'm'] as const;
const shapes = ['square', 'circle'] as const;
const widths = ['auto', 'full', 'half', 'third'] as const;
const layouts = ['center', 'start', 'space-between'] as const;

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    appearance: {
      control: 'radio',
      options: ['text', 'outlined', 'tinted', 'filled'],
    },
    ariaLabel: { control: 'text' },
    children: { control: 'text' },
    color: {
      control: 'radio',
      options: ['primary', 'neutral', 'informative', 'negative'],
    },
    disabled: { control: 'boolean' },
    icon: {
      control: 'radio',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
    },
    leadingIcon: {
      control: 'radio',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
    },
    trailingIcon: {
      control: 'radio',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
    },
    layout: { control: 'radio', options: ['center', 'start', 'space-between'] },
    shape: { control: 'radio', options: ['square', 'circle'] },
    size: { control: 'radio', options: ['s', 'm'] },
    width: { control: 'radio', options: ['auto', 'full', 'half', 'third'] },
    href: { control: 'text' },
    target: { control: 'text' },
    type: { control: 'radio', options: ['button', 'submit', 'reset'] },
  },
  args: {
    appearance: 'text',
    ariaLabel: undefined,
    children: '送信',
    color: 'neutral',
    disabled: false,
    icon: undefined,
    leadingIcon: undefined,
    trailingIcon: undefined,
    layout: 'center',
    onClick: () => {
      // noop for stories
    },
    shape: 'square',
    size: 'm',
    width: 'auto',
    href: undefined,
    target: undefined,
    type: 'button',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AppearancesAndColors: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={stackStyle}>
      {appearances.map((appearance) => (
        <div key={appearance} style={sectionStyle}>
          <Text as="h1">{`appearance: ${appearance}`}</Text>
          <div style={rowStyle}>
            {colors.map((color) => (
              <Button
                key={color}
                {...args}
                appearance={appearance}
                color={color}
                leadingIcon={iconOptions.plus}
              >
                追加
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const SizesAndShape: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={{ ...stackStyle, gap: '2rem' }}>
      {sizes.map((size) => (
        <div key={size}>
          <Text as="h1" fontWeight="bold">{`size: ${size}`}</Text>
          <div style={stackStyle}>
            {shapes.map((shape) => (
              <div key={shape} style={sectionStyle}>
                <Text as="h2">{`shape: ${shape}`}</Text>
                <div style={rowStyle}>
                  <Button {...args} appearance="outlined" size={size} shape={shape}>
                    送信
                  </Button>
                  <Button
                    {...args}
                    appearance="outlined"
                    size={size}
                    shape={shape}
                    leadingIcon={iconOptions.plus}
                  >
                    追加
                  </Button>
                  <Button
                    {...args}
                    appearance="outlined"
                    size={size}
                    shape={shape}
                    trailingIcon={iconOptions.chevronRight}
                  >
                    次へ
                  </Button>
                  <Button
                    {...args}
                    appearance="outlined"
                    size={size}
                    shape={shape}
                    leadingIcon={iconOptions.folder}
                    trailingIcon={iconOptions.chevronsUpDown}
                  >
                    保存先
                  </Button>
                  <Button
                    {...args}
                    appearance="outlined"
                    size={size}
                    shape={shape}
                    icon={iconOptions.search}
                  >
                    検索
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Widths: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={stackStyle}>
      {widths.map((width) => (
        <div key={width} style={sectionStyle}>
          <Text as="h1">{`width: ${width}`}</Text>
          <Button {...args} appearance="outlined" width={width}>
            送信
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Layouts: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={stackStyle}>
      {layouts.map((layout) => (
        <div key={layout} style={sectionStyle}>
          <Text as="h1">{`layout: ${layout}`}</Text>
          <Button
            {...args}
            appearance="outlined"
            width="full"
            layout={layout}
            leadingIcon={iconOptions.folder}
            trailingIcon={iconOptions.chevronsUpDown}
          >
            保存先
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={rowStyle}>
      {appearances.map((appearance) => (
        <Button key={appearance} {...args} appearance={appearance} disabled>
          送信
        </Button>
      ))}
    </div>
  ),
};

export const AsLink: Story = {
  parameters: { controls: { disable: true } },
  render: ({ type: _type, ...args }) => (
    <div style={rowStyle}>
      <Button
        {...args}
        appearance="outlined"
        href="https://example.com"
        trailingIcon={iconOptions.chevronRight}
      >
        次へ
      </Button>
      <Button
        {...args}
        appearance="outlined"
        href="https://example.com"
        target="_blank"
        trailingIcon={iconOptions.externalLink}
      >
        もっと詳しく
      </Button>
      <Button
        {...args}
        appearance="outlined"
        href="https://example.com"
        disabled
        trailingIcon={iconOptions.chevronRight}
      >
        次へ
      </Button>
    </div>
  ),
};
