"use client";

import type { ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/cn";

// shadcn 기본 DialogContent는 `rounded-lg border bg-background p-6 shadow-lg`로 스스로 카드를 그린다 —
// 이 서비스의 모달은 폴라로이드 카드/카드 더미처럼 연출이 제각각이라 껍데기를 비워두고,
// 위치 잡기(화면 중앙)와 열고닫기 모션만 여기서 책임진다.

const Dialog = ({ ...props }: ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
);

const DialogPortal = ({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
);

const DialogClose = ({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in",
      className,
    )}
    {...props}
  />
);

const DialogContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      data-slot="dialog-content"
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 outline-none data-[state=closed]:animate-modal-out data-[state=open]:animate-modal-in",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn("font-extrabold", className)}
    {...props}
  />
);

const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn("text-sm text-neutral-700", className)}
    {...props}
  />
);

// Portal/Overlay는 DialogContent 안에서만 쓴다 — 호출부에 노출하지 않는다.
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle };
