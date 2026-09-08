import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";

import { Toaster } from "./sonner";
import { Button } from "./button";

// Toaster는 화면에 하나만 떠 있는 컨테이너라 그 자체로는 볼 게 없다 — 띄우는 버튼과 함께 둔다.
const ToasterDemo = () => (
  <div className="flex flex-col items-start gap-2">
    <Button onClick={() => toast.error("위치 확인에 실패했어요. 다시 시도해주세요.")}>
      에러 띄우기
    </Button>
    <Button onClick={() => toast.success("오늘 구름을 기록했어요")}>성공 띄우기</Button>
    <Button
      onClick={() => toast.error("저장에 실패했어요", { description: "잠시 후 다시 시도해주세요" })}
    >
      설명 있는 에러
    </Button>
    <Toaster />
  </div>
);

const meta = {
  title: "shared/ui/Toaster",
  component: ToasterDemo,
  parameters: {
    docs: {
      description: {
        component: `에러 메시지의 공통 채널. **화면 위(top-center)에서 잠깐 떴다 사라진다** —\
 어떤 에러가 토스트고 어떤 게 화면에 남는 상태인지는 → docs/UI-SYSTEM.md "토스트".\
 sonner 기본 스타일은 \`unstyled\`로 끄고 클래스를 전부 우리가 준다(둥근 모서리 + soft shadow가\
 브루탈 톤과 정면으로 부딪힌다). 대지 색은 타입별 클래스에만 두는데, 베이스에 \`bg-white\`를 같이\
 넣으면 같은 속성끼리 부딪혀 흰 대지가 이겨버린다. 카메라 뷰파인더 위에도 뜨므로 딤에 기대지 않고\
 불투명 대지 + 검은 테두리로 읽히게 했다.`,
      },
    },
  },
} satisfies Meta<typeof ToasterDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
