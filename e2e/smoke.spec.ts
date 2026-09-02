import { expect, test } from "@playwright/test";

// 로그인 없이도 확인 가능한 최소 스모크 — 3개 탭이 크래시 없이 뜨는지, 하단 네비가 동작하는지만 본다.
// 실제 촬영/기록/좋아요 플로우는 카메라 하드웨어·Supabase 인증이 필요해 여기서 다루지 않는다.

test("카메라 탭은 비로그인 상태에서도 카메라를 바로 보여준다", async ({
  page,
}) => {
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

// 아래는 "사진첩은 본인 기록만"(ffbd26f) 이후 새로 생긴 규칙들.
// 비로그인 상태에서 확인 가능한 것만 다룬다 — 로그인 후 동작은 카카오 OAuth가 필요해 제외.

test("비로그인 사진첩은 '기록 없음'이 아니라 로그인 유도를 보여준다", async ({
  page,
}) => {
  // 사진첩이 본인 기록만 보여주게 되면서 비로그인은 항상 빈 화면이 된다.
  // 여기서 "이 달엔 기록된 구름이 없어요"가 뜨면 원인을 가리는 회귀다(기록은 있고 내 게 없을 뿐).
  await page.goto("/calendar");
  await expect(
    page.getByText("로그인하면 내가 모은 구름을 볼 수 있어요"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "카카오로 로그인" }),
  ).toBeVisible();
  await expect(page.getByText("이 달엔 기록된 구름이 없어요")).toBeHidden();
});

test("피드 상세 모달의 신고 버튼은 남의 기록에만 붙는다", async ({ page }) => {
  // 피드는 브라우저에서 PostgREST를 직접 때리므로 응답을 갈아끼울 수 있다.
  // 실제 데이터에 기대면 (1) 피드가 비었을 때 조용히 skip되고 (2) 비로그인은 is_mine이
  // 항상 false라 "내 기록엔 신고 버튼이 없다"는 정작 새로 생긴 규칙을 못 덮는다.
  const row = {
    entry_date: "2026-08-28",
    location_dong: "제주시 이도이동",
    tag: "맑음",
    comment: "구름 한 점 없이 맑았던 하루",
    photo_path: "u/2026-08-28.jpg",
    likes_count: 0,
  };
  await page.route("**/rest/v1/entry_feed*", (route) =>
    route.fulfill({
      json: [
        { ...row, id: "11111111-1111-4111-8111-111111111111", is_mine: false },
        { ...row, id: "22222222-2222-4222-8222-222222222222", is_mine: true },
      ],
    }),
  );
  // 좋아요 조회(entry_likes)는 비로그인이면 애초에 안 나가지만, 나가더라도 빈 배열로 받는다.
  await page.route("**/rest/v1/entry_likes*", (route) =>
    route.fulfill({ json: [] }),
  );

  await page.goto("/feed");
  // 로딩 스켈레톤이 걷히기 전에 세면 항상 0장이다.
  await expect(page.getByLabel("피드 불러오는 중")).toBeHidden();
  const cards = page.getByRole("button", { name: /기록 보기$/ });
  await expect(cards).toHaveCount(2);

  // 남의 기록 — 신고 버튼이 있어야 한다. 페이지 이동 없이 모달만 뜬다.
  await cards.first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "신고" })).toBeVisible();
  await expect(page).toHaveURL(/\/feed$/);

  // 내 기록 — 자기 글은 신고할 수 없다(3번 신고해 스스로 숨기는 경로 차단).
  await page.getByRole("button", { name: "닫기" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await cards.nth(1).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "신고" })).toBeHidden();
});
