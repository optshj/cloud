import type { Preview } from "@storybook/nextjs-vite";

// Tailwind v4 지시자와 프로젝트 팔레트·모달 키프레임이 전부 여기 있다.
// 이걸 안 불러오면 BRUTAL 토큰과 `--animate-modal-*`가 죽은 클래스가 된다.
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    // 프리미티브가 전부 흰 대지 + 검은 하드섀도라 흰 배경 위에선 테두리가 안 읽힌다.
    // 실제 화면 톤(`shared/ui/tokens.ts`의 THEME)을 그대로 배경으로 고른다.
    // 다크 모드는 제품 스코프 밖이라(→ docs/UI-SYSTEM.md "결정" §1) 한 벌만 둔다.
    backgrounds: {
      default: "사진첩(라벤더)",
      values: [
        { name: "사진첩(라벤더)", value: "#ede9fe" },
        { name: "카메라(하늘)", value: "#e0f2fe" },
        { name: "피드(코랄)", value: "#ffe4e6" },
        { name: "흰색", value: "#ffffff" },
      ],
    },
    controls: { expanded: true },
  },
};

export default preview;
