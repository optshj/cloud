import { CloudIcon } from "./icons";

// 실제 사진이 없을 때(시드/목업 데이터) 그라데이션 배경 위에 구름 아이콘을 얹어 보여준다.
export function PlaceholderPhoto({
  photoDataUrl,
  placeholderClass,
  className,
}: {
  photoDataUrl?: string;
  placeholderClass?: string;
  className?: string;
}) {
  // className으로 absolute 등 다른 position을 넘기면 Tailwind 클래스 병합 순서상 뒤에 나오는
  // "relative"가 항상 이겨서(둘 다 실려있으면 스타일시트 선언 순서가 우선) position:absolute가
  // 무력화되고 -inset-*이 박스를 안 채워 찌그러진다 — 넘어온 값이 없을 때만 relative를 기본값으로 쓴다.
  const hasPosition =
    /(?:^|\s)(?:absolute|fixed|sticky|static|relative)(?=\s|$)/.test(
      className ?? "",
    );
  return (
    <div
      className={`${hasPosition ? "" : "relative"} overflow-hidden ${placeholderClass ?? "bg-sky-100"} ${className ?? ""}`}
    >
      {photoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoDataUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <CloudIcon className="absolute inset-0 m-auto h-1/3 w-1/3 text-white/60" />
      )}
    </div>
  );
}
