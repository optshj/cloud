"use client";

import type { ComponentProps } from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { BRUTAL } from "@/shared/ui/tokens";

// `window.confirm` / `window.alert` 대체용. 브라우저 기본 창은 톤을 깨고 웹뷰 앱화 시 더 어색해진다.
// shadcn 생성 코드의 size/media 변형은 이 프로젝트에서 쓸 일이 없어 걷어냈다.

const AlertDialog = ({ ...props }: ComponentProps<typeof AlertDialogPrimitive.Root>) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
);

const AlertDialogContent = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className="data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in fixed inset-0 z-50 bg-black/50"
    />
    <AlertDialogPrimitive.Content
      data-slot="alert-dialog-content"
      className={cn(
        `${BRUTAL} data-[state=closed]:animate-modal-out data-[state=open]:animate-modal-in fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-3 bg-white p-5 outline-none`,
        className,
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
);

const AlertDialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title
    data-slot="alert-dialog-title"
    className={cn("text-base font-extrabold", className)}
    {...props}
  />
);

const AlertDialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description
    data-slot="alert-dialog-description"
    className={cn("text-sm leading-relaxed text-neutral-700", className)}
    {...props}
  />
);

const AlertDialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="alert-dialog-footer"
    className={cn("grid grid-cols-2 gap-2 pt-1", className)}
    {...props}
  />
);

const AlertDialogAction = ({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<ComponentProps<typeof Button>, "variant">) => (
  <Button variant={variant} asChild>
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  </Button>
);

const AlertDialogCancel = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel>) => (
  <Button variant="default" asChild>
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      {...props}
    />
  </Button>
);

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
};
