import { expect, test } from "@playwright/test";

// 로그인 없이도 확인 가능한 최소 스모크 — 3개 탭이 크래시 없이 뜨는지, 하단 네비가 동작하는지만 본다.
// 실제 촬영/기록/좋아요 플로우는 카메라 하드웨어·Supabase 인증이 필요해 여기서 다루지 않는다.

test("카메라 탭은 비로그인 상태에서도 카메라를 바로 보여준다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "촬영" })).toBeVisible();
});

test("하단 네비로 사진첩 탭 이동", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "사진첩" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("button", { name: "이전 달" })).toBeVisible();
});

test("하단 네비로 피드 탭 이동", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "피드" }).click();
  await expect(page).toHaveURL(/\/feed$/);
});
