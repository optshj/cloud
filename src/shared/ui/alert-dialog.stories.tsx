"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";

const AlertDialogDemo = ({
  title,
  description,
  confirmLabel,
  isDestructive = true,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="link" className="text-neutral-500" onClick={() => setIsOpen(true)}>
        {confirmLabel}
      </Button>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant={isDestructive ? "destructive" : "default"}>
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const meta = {
  title: "shared/ui/AlertDialog",
  component: AlertDialogDemo,
  args: {
    title: "이 기록을 삭제할까요?",
    description: "8월 23일에 기록한 사진과 코멘트가 함께 지워져요. 되돌릴 수 없어요.",
    confirmLabel: "삭제하기",
  },
} satisfies Meta<typeof AlertDialogDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteEntry: Story = {
  name: "기록 삭제",
};

export const DeleteAccount: Story = {
  name: "탈퇴",
  args: {
    title: "정말 탈퇴할까요?",
    description: "사진·캘린더·위치기록이 즉시 전부 삭제돼요. 되돌릴 수 없어요.",
    confirmLabel: "탈퇴하기",
  },
};

export const Report: Story = {
  name: "신고",
  args: {
    title: "이 게시물을 신고할까요?",
    description: "신고가 쌓이면 이 기록은 피드에서 자동으로 숨겨져요.",
    confirmLabel: "신고하기",
  },
};
