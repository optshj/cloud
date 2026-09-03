import { BRUTAL_SM } from "@/shared/ui/tokens";

// 로딩 스켈레톤은 실제 카드와 "같은 파일에서" 관리한다 — 카드 레이아웃이 바뀌었는데
// 스켈레톤만 그대로면 데이터 도착 순간 레이아웃이 튀기 때문.
// 이 컴포넌트의 골격은 EntryFeedCard와 1:1로 맞춰져 있다(기울기는 id로 정해지므로 여기선 뺀다).

export const EntryFeedCardSkeleton = () => (
  <div aria-hidden className={`${BRUTAL_SM} flex flex-col bg-white p-1.5 pb-2.5`}>
    <div className="skeleton aspect-square w-full" />
    <div className="flex flex-1 flex-col px-0.5 pt-2">
      <div className="skeleton h-2.5 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="mt-auto flex items-center gap-1.5 pt-1">
        <div className="skeleton h-4 w-4 rounded-full" />
        <div className="skeleton h-5 w-5" />
      </div>
    </div>
  </div>
);
