import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlaceholderPhoto } from "./PlaceholderPhoto";
import { BRUTAL_SM } from "./tokens";

// 1x1 하늘색 픽셀 — 실제 Storage URL에 기대지 않으려고 인라인으로 둔다.
const SKY_PIXEL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#7dd3fc"/><circle cx="3" cy="3" r="2" fill="#fff"/><circle cx="5" cy="4" r="1.6" fill="#fff"/></svg>`,
)}`;

const meta = {
  title: "shared/ui/PlaceholderPhoto",
  component: PlaceholderPhoto,
  parameters: {
    docs: {
      description: {
        component: `사진이 없으면 구름 아이콘을, 있으면 도착 전까지 \`.shimmer\`를 흘리다가\
 \`.photo-fade-in\`으로 짧게 페이드인시킨다 — 툭 튀어나오지 않게. \`className\`으로 \`absolute\` 같은\
 position을 넘기면 기본값 \`relative\`를 붙이지 않는다(둘 다 실리면 선언 순서상 \`relative\`가 이겨서\
 박스가 찌그러진다).`,
      },
    },
  },
} satisfies Meta<typeof PlaceholderPhoto>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoPhoto: Story = {
  name: "사진 없음",
  args: { className: "aspect-square w-40 border-2 border-black" },
};

export const WithPhoto: Story = {
  name: "사진 있음",
  args: {
    photoDataUrl: SKY_PIXEL,
    className: "aspect-square w-40 border-2 border-black",
  },
};

// 달력 칸의 미니 폴라로이드 — 같은 컴포넌트가 40px 남짓에서도 읽혀야 한다.
export const CalendarCellSize: Story = {
  name: "달력 칸 크기",
  render: () => (
    <div className="grid w-[240px] grid-cols-7 gap-1">
      {Array.from({ length: 14 }, (_, i) => (
        <div
          key={i}
          className={`relative aspect-square bg-white p-[2px] pb-[11px] shadow-[1px_1px_0_0_rgba(0,0,0,0.28)] ${
            i % 2 === 0 ? "-rotate-1" : "rotate-1"
          }`}
        >
          <PlaceholderPhoto
            photoDataUrl={i % 3 === 0 ? SKY_PIXEL : undefined}
            className="absolute inset-[2px] bottom-[11px]"
          />
          <span className="absolute inset-x-0 bottom-px text-[10px] leading-none">{i + 1}</span>
        </div>
      ))}
    </div>
  ),
};

export const PolaroidCard: Story = {
  name: "폴라로이드 카드",
  render: () => (
    <div className={`${BRUTAL_SM} w-[160px] -rotate-1 bg-white p-1.5 pb-2.5`}>
      <PlaceholderPhoto
        photoDataUrl={SKY_PIXEL}
        className="aspect-square w-full border border-black/20"
      />
      <div className="w-full px-0.5 pt-2">
        <p className="truncate text-[13px] font-extrabold">제주시 이도이동</p>
        <p className="line-clamp-2 text-xs leading-snug text-neutral-700">
          구름 한 점 없이 맑았던 하루
        </p>
      </div>
    </div>
  ),
};
