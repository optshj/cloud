import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

// shadcn 기본값(`animate-pulse bg-accent`)은 하드섀도/굵은 테두리 위에서 카드가 깨진 것처럼 보인다 —
// globals.css의 `.skeleton`(불투명 블록 + 광택 쓸기)을 쓴다.
const Skeleton = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="skeleton" className={cn("skeleton", className)} {...props} />
);

export { Skeleton };
