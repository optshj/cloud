import { BRUTAL_SM } from "@/shared/ui/tokens";

// 로딩 스켈레톤은 실제 카드와 "같은 파일에서" 관리한다 — 카드 레이아웃이 바뀌었는데
// 스켈레톤만 그대로면 데이터 도착 순간 레이아웃이 튀기 때문.
// 이 컴포넌트의 골격은 EntryFeedCard와 1:1로 맞춰져 있다.

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
