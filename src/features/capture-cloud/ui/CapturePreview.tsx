import type { ReactNode } from "react";
import { BRUTAL, BRUTAL_SM } from "@/shared/ui/tokens";
import { XIcon } from "@/shared/ui/icons";
import { formatDisplayDate } from "@/shared/lib/date";

export type Captured = { photoDataUrl: string; tag: string; comment: string };

export function CapturePreview({
  captured,
  location,
  dateKeyStr,
  saving,
  loggedIn = true,
  loginSlot,
  onRetake,
  onRecord,
  onDownload,
}: {
  captured: { photoDataUrl: string; tag?: string; comment?: string };
  location?: string;
  dateKeyStr: string;
  saving?: boolean;
  loggedIn?: boolean;
  loginSlot?: ReactNode;
  onRetake: () => void;
  onRecord?: () => void;
  onDownload?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className={`relative ${BRUTAL} bg-white p-3`}>
        <button
          type="button"
          onClick={onRetake}
          aria-label="닫기"
          className={`${BRUTAL_SM} absolute -right-3 -top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
        <div className="overflow-hidden border-2 border-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={captured.photoDataUrl} alt="촬영한 하늘 사진" className="aspect-[4/5] w-full object-cover" />
        </div>
        {loggedIn && (
          <div className="space-y-1 pt-3">
            <p className="font-extrabold">{location}</p>
            <p className="text-sm text-neutral-700">{captured.comment}</p>
            <p className="text-right text-xs text-neutral-500">{formatDisplayDate(dateKeyStr)}</p>
          </div>
        )}
      </div>

      {loggedIn ? (
        <>
          <button
            type="button"
            onClick={onRecord}
            disabled={saving}
            className={`${BRUTAL} bg-gradient-to-r from-violet-200 to-violet-300 py-3 font-extrabold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60`}
          >
            {saving ? "기록하는 중..." : "기록하기"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onRetake}
              className={`${BRUTAL} bg-emerald-100 py-2 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
            >
              다시찍기
            </button>
            <button
              type="button"
              onClick={onDownload}
              className={`${BRUTAL} bg-amber-100 py-2 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
            >
              다운로드
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-center text-sm text-neutral-600">로그인하면 AI 코멘트와 함께 기록할 수 있어요</p>
          {loginSlot}
          <button
            type="button"
            onClick={onRetake}
            className={`${BRUTAL} bg-emerald-100 py-2 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            다시찍기
          </button>
        </>
      )}
    </div>
  );
}
