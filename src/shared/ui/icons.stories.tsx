import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LogoIcon } from "./icons";

// lucide에 대응물이 있는 아이콘은 호출부가 `lucide-react`에서 직접 가져온다 —
// 그것들은 lucide 문서가 카탈로그라 여기서 다시 늘어놓지 않는다.
// 이 파일이 갖는 건 서비스 고유 로고 하나뿐이다.
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

// 실제로는 헤더에서 32px 남짓으로 쓴다 — 그 크기에서 구름 윤곽이 뭉개지지 않는지가 관건이다.
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
