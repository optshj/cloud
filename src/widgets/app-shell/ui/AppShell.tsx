import type { ReactNode } from "react";
import { TopHeader } from "./TopHeader";
import { BottomNav } from "./BottomNav";
import type { ThemeKey } from "@/shared/ui/tokens";
import { THEME } from "@/shared/ui/tokens";

export const AppShell = ({
  theme,
  title,
  children,
}: {
  theme: ThemeKey;
  title: string;
  children: ReactNode;
}) => {
  const t = THEME[theme];
  return (
    // relative는 BottomNav의 위치 기준이다 — 그 nav는 배경 없이 콘텐츠 위에 떠 있다.
    <div
      id="app-frame"
      className={`relative mx-auto flex h-dvh w-full max-w-md flex-col ${t.body}`}
    >
      <TopHeader headerClass={t.navIdle} title={title} />
      <main className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto ${t.body}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
