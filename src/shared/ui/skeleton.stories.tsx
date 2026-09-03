import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "./skeleton";
import { PlaceholderPhoto } from "./PlaceholderPhoto";
import { BRUTAL, BRUTAL_SM } from "./tokens";

const meta = {
  title: "shared/ui/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: `shadcn 기본값(\`animate-pulse bg-accent\`)을 쓰지 않는다 — 굵은 테두리 + 하드섀도\
 위에서 opacity가 깜빡이면 **카드가 깨진 것처럼** 보인다. 대신 불투명 블록 위로 광택을 쓸어 지나가게\
 한다(globals.css의 \`.skeleton\`). 사진 자리처럼 배경색을 살려야 하는 곳은 광택만 쓰는\
 \`.shimmer\`다(→ docs/UI-SYSTEM.md 결정 §2).`,
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { className: "h-5 w-40" },
};

// 스켈레톤은 실제 카드와 1:1이어야 한다 — 모양이 다르면 데이터가 도착하는 순간 레이아웃이 튄다.
export const MatchesRealCard: Story = {
  name: "실제 카드와 1:1",
  render: () => (
    <div className="grid w-[340px] grid-cols-2 gap-3">
      <div className={`${BRUTAL_SM} flex flex-col bg-white p-1.5 pb-2.5`}>
        <div className="skeleton aspect-square w-full" />
        <div className="w-full space-y-1.5 px-0.5 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className={`${BRUTAL_SM} flex flex-col bg-white p-1.5 pb-2.5`}>
        <PlaceholderPhoto className="aspect-square w-full border border-black/20" />
        <div className="w-full px-0.5 pt-2">
          <p className="truncate text-[13px] font-extrabold">제주시 이도이동</p>
          <p className="line-clamp-2 text-xs leading-snug text-neutral-700">
            구름 한 점 없이 맑았던 하루
          </p>
        </div>
      </div>
    </div>
  ),
};

// 사진 자리는 배경색을 살려야 해서 `.skeleton`이 아니라 `.shimmer`를 쓴다.
export const PhotoSlotUsesShimmer: Story = {
  name: "사진 자리는 shimmer",
  render: () => (
    <div className={`${BRUTAL} w-[160px] bg-white p-2`}>
      <div className="relative aspect-square w-full overflow-hidden border-2 border-black bg-sky-100">
        <span aria-hidden className="shimmer absolute inset-0 block" />
      </div>
    </div>
  ),
};
