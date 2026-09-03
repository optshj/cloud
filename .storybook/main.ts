import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  // `src/shared/ui`의 프리미티브만 다룬다. 화면 조립물(views/widgets)은 Supabase 조회·세션에
  // 묶여 있어 스토리로 세우려면 목업이 컴포넌트보다 커진다 — 그건 e2e가 맡는다.
  stories: ["../src/shared/ui/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
};

export default config;
