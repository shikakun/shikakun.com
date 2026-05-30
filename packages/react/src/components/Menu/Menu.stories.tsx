import type { Meta, StoryObj } from '@storybook/react';
import { LuChevronDown, LuCopy, LuPencil, LuTrash } from 'react-icons/lu';
import { Menu } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger appearance="outlined" trailingIcon={<LuChevronDown size={18} />}>
        操作
      </Menu.Trigger>
      <Menu.Popup>
        <Menu.Item leadingIcon={<LuPencil size={16} />} onClick={() => {}}>
          編集
        </Menu.Item>
        <Menu.Item leadingIcon={<LuCopy size={16} />} onClick={() => {}}>
          複製
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="negative" leadingIcon={<LuTrash size={16} />} onClick={() => {}}>
          削除
        </Menu.Item>
      </Menu.Popup>
    </Menu>
  ),
};
