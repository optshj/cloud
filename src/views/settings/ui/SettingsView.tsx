"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/widgets/app-shell";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { useSession } from "@/entities/session";
import { KakaoLoginButton } from "@/features/login-kakao";
import { createClient } from "@/shared/lib/supabase/client";

export function SettingsView() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleDeleteAccount() {
    if (!window.confirm("탈퇴하면 사진/캘린더/기록이 즉시 전부 삭제돼요. 계속할까요?")) return;
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      window.alert("탈퇴 처리에 실패했어요. 다시 시도해주세요.");
      setBusy(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <AppShell theme="calendar" title="설정">
        {null}
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell theme="calendar" title="설정">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="font-bold">로그인하고 구름을 기록해보세요</p>
          <KakaoLoginButton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell theme="calendar" title="설정">
      <div className="flex flex-1 flex-col gap-6 p-4">
        <h1 className="px-1 pt-1 text-xl font-extrabold">설정</h1>

        <section className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold uppercase tracking-wide text-neutral-500">계정</p>
          <div className={`${BRUTAL_SM} flex items-center gap-3 bg-white p-4`}>
            <div className={`${BRUTAL_SM} flex h-11 w-11 flex-none items-center justify-center rounded-full bg-amber-200 text-sm font-extrabold`}>
              {(user.email ?? "카")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.email ?? "카카오 계정"}</p>
              <p className="text-xs text-neutral-500">카카오로 로그인됨</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold uppercase tracking-wide text-neutral-500">일반</p>
          <SettingRow label="로그아웃" onClick={handleLogout} />
        </section>

        <section className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold uppercase tracking-wide text-rose-500">위험 구역</p>
          <SettingRow label="탈퇴하기" onClick={handleDeleteAccount} disabled={busy} danger />
        </section>
      </div>
    </AppShell>
  );
}

function SettingRow({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${BRUTAL_SM} flex items-center justify-between bg-white px-4 py-3 text-left text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
        danger ? "text-rose-600" : ""
      }`}
    >
      {label}
      <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
    </button>
  );
}
