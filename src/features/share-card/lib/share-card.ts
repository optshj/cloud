import { formatDisplayDate } from "@/shared/lib/date";

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // 없으면 cross-origin Storage URL이 canvas를 taint해 toDataURL이 실패한다.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`공유카드 이미지 로드 실패: ${src}`));
    img.src = src;
  });
};

type Box = { x: number; y: number; w: number; h: number };

const drawCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, { x, y, w, h }: Box) => {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
};

type ShareCardInput = {
  photoDataUrl: string;
  location: string;
  comment: string;
  displayDate: string;
};

const buildShareCardDataUrl = async (input: ShareCardInput): Promise<string> => {
  const width = 800;
  const height = 1000;
  const photoHeight = Math.round(height * 0.6);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context를 가져올 수 없습니다");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const img = await loadImage(input.photoDataUrl);
  drawCover(ctx, img, { x: 24, y: 24, w: width - 48, h: photoHeight - 24 });

  ctx.fillStyle = "#111111";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(input.location, 32, photoHeight + 60);

  ctx.font = "28px sans-serif";
  ctx.fillText(input.comment, 32, photoHeight + 105);

  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#666666";
  ctx.textAlign = "right";
  ctx.fillText(input.displayDate, width - 32, photoHeight + 105);
  ctx.textAlign = "left";

  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#999999";
  ctx.fillText("서비스 로고 · 나도 오늘 구름 기록하기", 32, height - 40);

  ctx.lineWidth = 10;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(5, 5, width - 10, height - 10);

  return canvas.toDataURL("image/png");
};

const downloadUrl = async (url: string, filename: string) => {
  // cross-origin URL(Storage)엔 download 속성이 안 먹어서 blob URL로 바꿔 받는다.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 다운로드 실패: ${res.status} ${url}`);
  const href = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  // 즉시 revoke하면 일부 브라우저(Safari)가 받기 전에 끊는다 — 넉넉히 두고 해제.
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
};

export type DownloadKind = "original" | "card";

export const downloadEntryImage = async (
  kind: DownloadKind,
  entry: { photoDataUrl: string; location: string; comment: string; dateKey: string },
) => {
  if (kind === "original") {
    await downloadUrl(entry.photoDataUrl, `구름-${entry.dateKey}-원본.jpg`);
    return;
  }
  const cardUrl = await buildShareCardDataUrl({
    photoDataUrl: entry.photoDataUrl,
    location: entry.location,
    comment: entry.comment,
    displayDate: formatDisplayDate(entry.dateKey),
  });
  await downloadUrl(cardUrl, `구름-${entry.dateKey}-카드.png`);
};
