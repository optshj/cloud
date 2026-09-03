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
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col bg-white">
      <TopHeader headerClass={t.header} title={title} />
      <main className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto ${t.body}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
