// 디지털 줌 중앙 크롭. 하드웨어 줌이면 호출부가 zoom=1을 넘긴다.
export const captureFrame = (video: HTMLVideoElement, zoom: number): string => {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cropW = vw / zoom;
  const cropH = vh / zoom;
  const sx = (vw - cropW) / 2;
  const sy = (vh - cropH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context를 가져올 수 없습니다");
  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
  return canvas.toDataURL("image/jpeg", 0.9);
};
