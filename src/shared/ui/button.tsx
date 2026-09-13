import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/cn";
import { BRUTAL, BRUTAL_SM, PRESS } from "@/shared/ui/tokens";

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
      // 터치 타겟 44px(min-h-11)을 여기서 보장한다. none만 호출부 책임.
      size: {
        default: "min-h-11 px-4 py-2 text-sm",
        lg: "min-h-11 px-4 py-3 text-base font-extrabold",
        sm: "min-h-11 px-3 py-1.5 text-xs",
        icon: "h-11 w-11",
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
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    return <Slot.Root data-slot="button" className={classes} {...props} />;
  }
  return <button data-slot="button" className={classes} {...props} type={props.type ?? "button"} />;
};

export { Button };
