// 실제 촬영된 프레임을 zoom 배율만큼 중앙 크롭한다 (디지털 줌).
// 하드웨어 줌이 되는 기기에서는 프레임이 이미 당겨져 들어오므로 호출부가 zoom=1을 넘긴다
// (→ CameraLive의 isHardwareZoom, docs/UI-SYSTEM.md "줌").
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
