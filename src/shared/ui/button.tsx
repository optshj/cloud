import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/cn";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";

// 섀도 오프셋만큼 밀어넣고 섀도를 없애 "눌린" 느낌을 낸다. 호출부 10여 곳에 복붙돼 있던 문자열.
const PRESS =
  "transition-transform duration-150 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

// variant는 "프레임 두께/톤"만 담당한다 — 배경색은 화면마다 제각각(연보라/노랑/민트/흰색/그라데이션)이라
// 억지로 토큰화하지 않고 호출부에서 `className="bg-*"`로 넘긴다.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-bold outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: `${BRUTAL} ${PRESS} bg-white`,
        thin: `${BRUTAL_SM} ${PRESS} bg-white`,
        destructive: `${BRUTAL} ${PRESS} bg-destructive text-white`,
        link: "font-bold underline underline-offset-2",
      },
      size: {
        default: "px-4 py-2 text-sm",
        lg: "px-4 py-3 text-base font-extrabold",
        sm: "px-3 py-1.5 text-xs",
        // 터치 타겟 최소 44px (accessibility 스킬)
        icon: "h-11 w-11",
        // 크기를 호출부가 직접 정하는 경우(폴라로이드 카드 위 X 버튼 등)
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) => {
  // `const Comp = asChild ? Slot.Root : "button"` 형태는 naming-convention(PascalCase 변수 금지)에
  // 걸려서 분기로 푼다.
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    // asChild면 자식이 <a>/<Link>일 수 있으니 type을 임의로 붙이지 않는다.
    return <Slot.Root data-slot="button" className={classes} {...props} />;
  }
  // 이 Button이 대체한 호출부들은 전부 `type="button"`이었다 — 기본값(submit)으로 두면
  // 나중에 <form> 안에 놓이는 순간 의도치 않게 제출된다.
  return (
    <button
      data-slot="button"
      className={classes}
      {...props}
      type={props.type ?? "button"}
    />
  );
};

export { Button };
