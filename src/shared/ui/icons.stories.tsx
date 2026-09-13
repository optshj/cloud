import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LogoIcon } from "./icons";

const meta = {
  title: "shared/ui/LogoIcon",
  component: LogoIcon,
  parameters: {
    docs: {
      description: {
        component: `아이콘 시안 v3 "9e — GRAPHITE" 채택안. 팔레트를 통째로 들고 있는 SVG라 \`className\`으로는 크기만 준다.`,
      },
    },
  },
} satisfies Meta<typeof LogoIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { className: "h-24 w-24" },
};

export const Sizes: Story = {
  name: "실제 쓰이는 크기",
  render: () => (
    <div className="flex items-end gap-4">
      {["h-6 w-6", "h-8 w-8", "h-12 w-12", "h-20 w-20"].map((size) => (
        <div key={size} className="text-center">
          <LogoIcon className={size} />
          <p className="pt-2 text-[10px] text-neutral-600">{size}</p>
        </div>
      ))}
    </div>
  ),
};
