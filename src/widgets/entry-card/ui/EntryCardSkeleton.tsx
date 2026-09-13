import { BRUTAL_SM } from "@/shared/ui/tokens";

// EntryFeedCard와 골격을 1:1로 맞춘다.
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
