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
  // 그냥 다른 화면으로 바뀐 것처럼 보이지 않게, 배경을 딤 처리하고 카드가 그 위에 뜬 것처럼
  // 보이게만 한다(실제 Dialog의 포커스 트랩 등은 필요 없다는 게 결정사항 — animate-overlay-in/
  // animate-modal-in은 Radix Dialog와 같은 시각 언어를 재사용하려고 globals.css 토큰만 가져온 것).
  // pb는 떠 있는 BottomNav(약 80px) 몫이다 — 안 두면 아래 버튼이 탭 뒤로 들어간다.
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
      {/* 버튼까지 카드 안에 들어간다 — 밖에 두면 카드와 버튼이 높이를 두고 다퉈서, 카드가
          줄거나(사진이 작아진다) 버튼이 접힌 아래로 밀린다(스크롤해야 보인다). 한 덩어리로
          묶고 사진만 flex로 남은 높이를 먹게 하면 세로 화면에서는 스크롤이 안 생긴다.
          overflow-y-auto는 그게 불가능한 경우(아래 사진 하한에 걸리는 짧은 화면)의 안전망이다. */}
      <div
        className={`animate-modal-in flex min-h-0 flex-1 flex-col overflow-y-auto ${BRUTAL} bg-white p-3`}
      >
        {/* 이 화면에서 유일하게 늘었다 줄었다 하는 칸이다 — aspect 고정을 버리고 남은 높이를
            채운 뒤 object-cover로 잘라낸다. 하한은 필수다: basis가 0이라 축소 배분에서 이 칸만
            0으로 깎여, 가로 모드처럼 세로가 짧으면 사진이 통째로 사라졌다. */}
        <div className="min-h-[30dvh] flex-1 overflow-hidden border-2 border-black">
          <img
            src={captured.photoDataUrl}
            alt="촬영한 하늘 사진"
            className="h-full w-full object-cover"
          />
        </div>
        {isLoggedIn && (
          // AI 코멘트가 유난히 길면 이 칸만 스크롤한다 — 사진과 버튼은 제자리에 남는다.
          <div className="min-h-0 space-y-1 overflow-y-auto pt-3">
            {/* 위치·날짜 / 태그 / 코멘트 — 사진첩·피드 상세와 같은 순서다. 저장하고 나서
                피드에서야 자기 태그를 처음 보던 것을 여기서 미리 보여준다. */}
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
