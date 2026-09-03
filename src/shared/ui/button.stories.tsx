import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { CameraIcon, XIcon } from "./icons";

const meta = {
  title: "shared/ui/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `variant는 **프레임 두께/톤만** 담당한다. 배경색은 화면마다 제각각(연보라/노랑/민트/\
흰색/그라데이션)이라 토큰화하지 않고 호출부가 \`className="bg-*"\`로 넘긴다\
 (→ docs/UI-SYSTEM.md 결정 §1).`,
      },
    },
  },
  args: { children: "버튼" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} variant="default">
        default
      </Button>
      <Button {...args} variant="thin">
        thin
      </Button>
      <Button {...args} variant="destructive">
        destructive
      </Button>
      <Button {...args} variant="link">
        link
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} size="lg">
        lg
      </Button>
      <Button {...args} size="default">
        default
      </Button>
      <Button {...args} size="sm">
        sm
      </Button>
      <Button {...args} size="icon" aria-label="닫기">
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const CallerProvidesColor: Story = {
  name: "색은 호출부가 넘긴다",
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} className="bg-violet-200">
        연보라
      </Button>
      <Button {...args} className="bg-amber-200">
        노랑
      </Button>
      <Button {...args} className="bg-emerald-200">
        민트
      </Button>
      <Button {...args} className="bg-gradient-to-b from-sky-200 to-sky-100">
        그라데이션
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  name: "아이콘과 함께",
  args: {
    className: "bg-sky-200",
    children: (
      <>
        <CameraIcon className="h-4 w-4" />
        오늘 하늘 찍기
      </>
    ),
  },
};

// 터치 타겟은 최소 44px이다 — `size="icon"`이 그 규격(h-11 w-11)이고,
// `size="none"`은 호출부가 크기를 직접 정할 때만 쓴다(→ docs/UI-SYSTEM.md 결정 §8).
export const TouchTarget44: Story = {
  name: "터치 타겟 44px",
  render: () => (
    <div className="flex items-end gap-4">
      <div className="text-center">
        <Button variant="thin" size="icon" aria-label="닫기" className="rotate-2">
          <XIcon className="h-4 w-4" />
        </Button>
        <p className="pt-2 text-xs font-bold">44px ✓</p>
      </div>
      <div className="text-center">
        <Button variant="thin" size="none" aria-label="닫기" className="h-9 w-9 rotate-2">
          <XIcon className="h-4 w-4" />
        </Button>
        <p className="pt-2 text-xs text-neutral-500">36px (미달)</p>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, className: "bg-violet-200" },
};
