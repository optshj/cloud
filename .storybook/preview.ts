import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
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
