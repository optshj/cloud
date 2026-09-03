const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Storage의 https URL은 cross-origin이라, 이게 없으면 canvas가 tainted 상태가 돼서 toDataURL이 실패한다.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const drawCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
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

// 외부 공유용 카드 이미지를 합성한다. 워터마크(서비스명 자리)를 항상 포함 — 바이럴 도달용.
export const buildShareCardDataUrl = async (input: ShareCardInput): Promise<string> => {
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
  drawCover(ctx, img, 24, 24, width - 48, photoHeight - 24);

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

export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
};
