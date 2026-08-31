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
  return (
    <div className={`relative overflow-hidden ${placeholderClass ?? "bg-sky-100"} ${className ?? ""}`}>
      {photoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <CloudIcon className="absolute inset-0 m-auto h-1/3 w-1/3 text-white/60" />
      )}
    </div>
  );
}
