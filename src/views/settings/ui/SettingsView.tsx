"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/widgets/app-shell";
import { BRUTAL_SM } from "@/shared/ui/tokens";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useSession } from "@/entities/session";
import { KakaoLoginButton } from "@/features/login-kakao";
import { createClient } from "@/shared/lib/supabase/client";

export const SettingsView = () => {
  const router = useRouter();
  const { user, loading: isLoading } = useSession();
  const [isBusy, setIsBusy] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    setIsBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("settings: 탈퇴(DELETE /api/account) 실패", res.status, body);
      setErrorMessage(body?.error ?? "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
      setIsBusy(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // 세션 조회 중 {null}을 렌더하면 흰 화면이 깜빡인다 — 실제 골격과 같은 자리를 잡아둔다.
  if (isLoading) {
    return (
      <AppShell theme="calendar" title="설정">
        <div
          className="flex flex-1 flex-col gap-6 p-4"
          aria-busy="true"
          aria-label="설정 불러오는 중"
        >
          <Skeleton className="mx-1 mt-1 h-7 w-20" />
          <section className="flex flex-col gap-2">
            <Skeleton className="mx-1 h-3 w-10" />
            <div className={`${BRUTAL_SM} flex items-center gap-3 bg-white p-4`}>
              <Skeleton className="h-11 w-11 flex-none rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <Skeleton className="mx-1 h-3 w-10" />
            <Skeleton className={`${BRUTAL_SM} h-[46px] w-full`} />
          </section>
          <section className="flex flex-col gap-2">
            <Skeleton className="mx-1 h-3 w-16" />
            <Skeleton className={`${BRUTAL_SM} h-[46px] w-full`} />
          </section>
        </div>
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
          <p className="px-1 text-xs font-bold tracking-wide text-neutral-500 uppercase">계정</p>
          <div className={`${BRUTAL_SM} flex items-center gap-3 bg-white p-4`}>
            <div
              className={`${BRUTAL_SM} flex h-11 w-11 flex-none items-center justify-center rounded-full bg-amber-200 text-sm font-extrabold`}
            >
              {(user.email ?? "카")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.email ?? "카카오 계정"}</p>
              <p className="text-xs text-neutral-500">카카오로 로그인됨</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold tracking-wide text-neutral-500 uppercase">일반</p>
          <SettingRow label="로그아웃" onClick={handleLogout} />
        </section>

        <section className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold tracking-wide text-rose-500 uppercase">위험 구역</p>
          <SettingRow
            label="탈퇴하기"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isBusy}
            danger
          />
        </section>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>정말 탈퇴할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            탈퇴하면 지금까지 기록한 사진·캘린더·코멘트가 즉시 전부 삭제돼요. 되돌릴 수 없어요.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteAccount}>
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={errorMessage !== null} onOpenChange={() => setErrorMessage(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>탈퇴를 처리하지 못했어요</AlertDialogTitle>
          <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          <AlertDialogFooter className="grid-cols-1">
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

const SettingRow = ({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <Button
    variant="thin"
    size="none"
    onClick={onClick}
    disabled={disabled}
    className={`justify-between px-4 py-3 text-left ${danger ? "text-rose-600" : ""}`}
  >
    {label}
    <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
  </Button>
);
