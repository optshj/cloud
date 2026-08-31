import { BRUTAL_SM } from "@/shared/ui/tokens";

// 로딩 스켈레톤은 실제 카드와 "같은 파일에서" 관리한다 — 카드 레이아웃이 바뀌었는데
// 스켈레톤만 그대로면 데이터 도착 순간 레이아웃이 튀기 때문.
// 아래 두 컴포넌트의 골격은 각각 EntryFeedCard / EntryListCard와 1:1로 맞춰져 있다.

export const EntryFeedCardSkeleton = () => (
  <div
    aria-hidden
    className={`${BRUTAL_SM} flex flex-col overflow-hidden bg-white`}
  >
    <div className="skeleton aspect-square w-full" />
    <div className="flex flex-1 flex-col gap-1 p-2">
      <div className="skeleton h-3 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="mt-auto flex items-center gap-1.5 pt-1">
        <div className="skeleton h-4 w-4 rounded-full" />
        <div className="skeleton h-4 w-5" />
      </div>
    </div>
  </div>
);

export const EntryListCardSkeleton = () => (
  <div
    aria-hidden
    className={`${BRUTAL_SM} flex aspect-[4/3] flex-col overflow-hidden bg-white`}
  >
    <div className="skeleton min-h-0 w-full flex-1" />
    <div className="relative shrink-0 border-t-2 border-black">
      <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
    </div>
    <div className="min-h-0 flex-1 space-y-2 overflow-hidden bg-amber-50 p-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
    </div>
  </div>
);
