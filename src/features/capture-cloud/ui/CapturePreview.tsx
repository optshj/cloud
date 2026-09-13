import type { ReactNode } from "react";
import { BRUTAL } from "@/shared/ui/tokens";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatDisplayDate } from "@/shared/lib/date";

export type Captured = { photoDataUrl: string; tag: string; comment: string };

export const CapturePreview = ({
  captured,
  location,
  dateKeyStr,
  isSaving,
  isDownloading,
  isLoggedIn = true,
  loginSlot,
  onRetake,
  onRecord,
  onDownload,
}: {
  captured: { photoDataUrl: string; tag?: string; comment?: string };
  location?: string;
  dateKeyStr: string;
  isSaving?: boolean;
  isDownloading?: boolean;
  isLoggedIn?: boolean;
  loginSlot?: ReactNode;
  onRetake: () => void;
  onRecord?: () => void;
  onDownload?: () => void;
}) => (
  <div className="animate-overlay-in flex min-h-0 flex-1 flex-col bg-black/60 p-6 pb-28">
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Button
        variant="thin"
        size="icon"
        onClick={onRetake}
        aria-label="닫기"
        className="absolute -top-3 -right-3 z-10 rotate-2"
      >
        <X className="h-4 w-4" />
      </Button>
      <div
        className={`animate-modal-in flex min-h-0 flex-1 flex-col overflow-y-auto ${BRUTAL} bg-white p-3`}
      >
        {/* min-h 하한 필수 — 없으면 세로가 짧을 때 사진 칸이 0으로 깎인다. */}
        <div className="min-h-[30dvh] flex-1 overflow-hidden border-2 border-black">
          <img
            src={captured.photoDataUrl}
            alt="촬영한 하늘 사진"
            className="h-full w-full object-cover"
          />
        </div>
        {isLoggedIn && (
          <div className="min-h-0 space-y-1 overflow-y-auto pt-3">
            <div className="flex items-end justify-between gap-2">
              <p className="text-xs text-neutral-600">{location}</p>
              <p className="text-xs whitespace-nowrap text-neutral-600">
                {formatDisplayDate(dateKeyStr)}
              </p>
            </div>
            <p className="text-[15px] font-extrabold">{captured.tag}</p>
            <p className="text-sm text-neutral-700">{captured.comment}</p>
          </div>
        )}

        {isLoggedIn ? (
          <div className="flex flex-col gap-2 pt-3">
            <Button
              size="lg"
              onClick={onRecord}
              disabled={isSaving}
              aria-busy={isSaving}
              className="bg-violet-300"
            >
              {isSaving ? "기록하는 중..." : "기록하기"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onRetake} className="bg-emerald-100 py-2">
                다시찍기
              </Button>
              <Button
                onClick={onDownload}
                disabled={isDownloading}
                aria-busy={isDownloading}
                className="bg-amber-100 py-2"
              >
                {isDownloading ? "만드는 중..." : "다운로드"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-3">
            <p className="text-center text-sm font-bold">
              로그인하면 AI 코멘트와 함께 기록할 수 있어요
            </p>
            {loginSlot}
            <Button onClick={onRetake} className="bg-emerald-100 py-2">
              다시찍기
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
);
