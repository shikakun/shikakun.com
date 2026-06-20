import type { Meta, StoryObj } from '@storybook/react';
import { sectionStyle, stackStyle } from '../../storyHelpers';
import { Text } from '../Text';
import { TextField } from './TextField';

const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'] as const;
const widths = ['full', 'half', 'third'] as const;

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    errorMessage: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    width: { control: 'select', options: ['full', 'half', 'third'] },
    rows: { control: 'number' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    error: { control: 'boolean' },
  },
  args: {
    label: 'メールアドレス',
    description: '入力した内容をメールでお送りします',
    errorMessage: 'メールアドレスの形式が正しくありません',
    type: 'email',
    width: 'full',
    disabled: false,
    readOnly: false,
    required: false,
    error: false,
    autoComplete: 'email',
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={stackStyle}>
      <div style={sectionStyle}>
        <Text as="h1">default</Text>
        <TextField {...args} defaultValue="shikakun@example.com" description={undefined} />
      </div>
      <div style={sectionStyle}>
        <Text as="h1">required</Text>
        <TextField {...args} defaultValue="shikakun@example.com" description={undefined} required />
      </div>
      <div style={sectionStyle}>
        <Text as="h1">readOnly</Text>
        <TextField {...args} value="shikakun@example.com" description={undefined} readOnly />
      </div>
      <div style={sectionStyle}>
        <Text as="h1">disabled</Text>
        <TextField {...args} value="shikakun@example.com" description={undefined} disabled />
      </div>
      <div style={sectionStyle}>
        <Text as="h1">error</Text>
        <TextField {...args} defaultValue="shikakun.example.com" description={undefined} error />
      </div>
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
          <TextField {...args} width={width} />
        </div>
      ))}
    </div>
  ),
};

export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: ({ type: _type, rows: _rows, ...args }) => (
    <div style={stackStyle}>
      {types.map((type) => (
        <div key={type} style={sectionStyle}>
          <Text as="h1">type: {type}</Text>
          <TextField
            {...args}
            label={undefined}
            description={undefined}
            autoComplete={undefined}
            type={type}
            aria-label={`type: ${type}`}
          />
        </div>
      ))}
    </div>
  ),
};

export const MultiLine: Story = {
  parameters: { controls: { disable: true } },
  render: ({ type: _type, ...args }) => <TextField {...args} rows={4} />,
};
