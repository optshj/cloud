"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Button } from "./button";
import { XIcon } from "./icons";
import { PlaceholderPhoto } from "./PlaceholderPhoto";
import { BRUTAL } from "./tokens";

// 열고닫기 모션은 Radix의 `data-state` + globals.css 키프레임이 맡는다(framer-motion 아님).
// **exit가 재생되려면 Dialog root가 계속 마운트돼 있어야 한다** — 호출부에서
// `{selected && <Modal/>}`로 감싸면 부모가 먼저 사라져 exit가 씹힌다.
// 그래서 여기 스토리도 상시 마운트하고 `open`만 토글한다(→ docs/UI-SYSTEM.md 결정 §5).
const DialogDemo = ({ hasPhoto = false }: { hasPhoto?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button className="bg-violet-200" onClick={() => setIsOpen(true)}>
        열기
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`${BRUTAL} -rotate-2 bg-white p-2`}>
          <DialogClose asChild>
            <Button
              variant="thin"
              size="icon"
              aria-label="닫기"
              className="absolute -top-3 -right-3 z-10 rotate-2"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </DialogClose>
          {hasPhoto && <PlaceholderPhoto className="aspect-square w-full border-2 border-black" />}
          <div className="space-y-1 px-1 pt-3 pb-1">
            <DialogTitle>제주시 이도이동</DialogTitle>
            <DialogDescription>구름 한 점 없이 맑았던 하루</DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const meta = {
  title: "shared/ui/Dialog",
  component: DialogDemo,
  parameters: {
    docs: {
      description: {
        component: `shadcn 기본 \`DialogContent\`는 \`rounded-lg border bg-background p-6 shadow-lg\`로\
 스스로 카드를 그리지만, 이 서비스의 모달은 폴라로이드·카드 더미처럼 연출이 제각각이라 껍데기를\
 비워뒀다. 여기서 책임지는 건 **화면 중앙 위치 잡기와 열고닫기 모션**뿐이고 카드는 호출부가 그린다.`,
      },
    },
  },
} satisfies Meta<typeof DialogDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPhoto: Story = {
  name: "사진이 있는 카드",
  args: { hasPhoto: true },
};
