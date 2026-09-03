// 실제 촬영된 프레임을 zoom 배율만큼 중앙 크롭한다 (디지털 줌).
// ponytail: 하드웨어 광학 줌(MediaStreamTrack zoom constraint)은 미구현 — 착수 조건은 docs 남은 작업 목록 §2-7.
export function captureFrame(video: HTMLVideoElement, zoom: number): string {
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
}
