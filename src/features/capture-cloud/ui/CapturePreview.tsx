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
  isLoggedIn?: boolean;
  loginSlot?: ReactNode;
  onRetake: () => void;
  onRecord?: () => void;
  onDownload?: () => void;
}) => (
  // 그냥 다른 화면으로 바뀐 것처럼 보이지 않게, 배경을 딤 처리하고 카드가 그 위에 뜬 것처럼
  // 보이게만 한다(실제 Dialog의 포커스 트랩 등은 필요 없다는 게 결정사항 — animate-overlay-in/
  // animate-modal-in은 Radix Dialog와 같은 시각 언어를 재사용하려고 globals.css 토큰만 가져온 것).
  <div className="animate-overlay-in flex flex-1 flex-col gap-4 bg-black/60 p-6">
    <div className="relative">
      <Button
        variant="thin"
        size="icon"
        onClick={onRetake}
        aria-label="닫기"
        className="absolute -top-3 -right-3 z-10 rotate-2"
      >
        <X className="h-4 w-4" />
      </Button>
      {/* 내용(특히 AI 코멘트)이 뷰포트보다 길어질 수 있어 카드 안에서만 스크롤되게 한다 —
          전체 페이지가 넘치는 대신 이 안에서 갇힌다. */}
      <div className={`animate-modal-in max-h-[70dvh] overflow-y-auto ${BRUTAL} bg-white p-3`}>
        <div className="overflow-hidden border-2 border-black">
          <img
            src={captured.photoDataUrl}
            alt="촬영한 하늘 사진"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        {isLoggedIn && (
          <div className="space-y-1 pt-3">
            <p className="font-extrabold">{location}</p>
            <p className="text-sm text-neutral-700">{captured.comment}</p>
            <p className="text-right text-xs text-neutral-500">{formatDisplayDate(dateKeyStr)}</p>
          </div>
        )}
      </div>
    </div>

    {isLoggedIn ? (
      <>
        <Button
          size="lg"
          onClick={onRecord}
          disabled={isSaving}
          aria-busy={isSaving}
          className="bg-gradient-to-r from-violet-200 to-violet-300"
        >
          {isSaving ? "기록하는 중..." : "기록하기"}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onRetake} className="bg-emerald-100 py-2">
            다시찍기
          </Button>
          <Button onClick={onDownload} className="bg-amber-100 py-2">
            다운로드
          </Button>
        </div>
      </>
    ) : (
      <>
        <p className="text-center text-sm font-bold text-white">
          로그인하면 AI 코멘트와 함께 기록할 수 있어요
        </p>
        {loginSlot}
        <Button onClick={onRetake} className="bg-emerald-100 py-2">
          다시찍기
        </Button>
      </>
    )}
  </div>
);
