import { expect, test } from "@playwright/test";

test("카메라 탭은 비로그인 상태에서도 로그인으로 막지 않는다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "권한 허용하기" })).toBeVisible();
  await expect(page.getByText("로그인하면 AI 코멘트와 함께 기록할 수 있어요")).toBeHidden();
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

test("비로그인 사진첩은 '기록 없음'이 아니라 로그인 유도를 보여준다", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByText("로그인하면 내가 찍은 구름을 볼 수 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "카카오로 로그인" })).toBeVisible();
  await expect(page.getByText("이 달엔 기록된 구름이 없어요")).toBeHidden();
});

test("신고·좋아요 버튼은 남의 기록에만 붙는다", async ({ page }) => {
  // 비로그인은 is_mine이 항상 false라 실제 데이터로는 못 덮어서 응답을 갈아끼운다.
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
  await page.route("**/rest/v1/entry_likes*", (route) => route.fulfill({ json: [] }));

  await page.goto("/feed");
  await expect(page.getByLabel("피드 불러오는 중")).toBeHidden();
  const cards = page.getByRole("button", { name: /기록 보기$/ });
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole("button", { name: /^좋아요/ })).toHaveCount(1);

  await cards.first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "신고" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^좋아요/ })).toBeVisible();
  await expect(page).toHaveURL(/\/feed$/);

  await page.getByRole("button", { name: "닫기" }).click();
  await expect(dialog).toBeHidden();
  await cards.nth(1).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "신고" })).toBeHidden();
  await expect(dialog.getByRole("button", { name: /^좋아요/ })).toBeHidden();
});

test("피드 상세 모달은 닫힐 때 exit 애니메이션을 재생한다", async ({ page }) => {
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
      json: [{ ...row, id: "11111111-1111-4111-8111-111111111111", is_mine: false }],
    }),
  );
  await page.route("**/rest/v1/entry_likes*", (route) => route.fulfill({ json: [] }));

  await page.goto("/feed");
  await expect(page.getByLabel("피드 불러오는 중")).toBeHidden();
  await page.getByRole("button", { name: /기록 보기$/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.evaluate(() => {
    const played: string[] = [];
    (window as unknown as { playedAnimations: string[] }).playedAnimations = played;
    document.addEventListener(
      "animationstart",
      (event) => played.push((event as AnimationEvent).animationName),
      true,
    );
  });

  await page.getByRole("button", { name: "닫기" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  const played = await page.evaluate(
    () => (window as unknown as { playedAnimations: string[] }).playedAnimations,
  );
  expect(played).toContain("modal-out");
  expect(played).toContain("overlay-out");
});

test.describe("권한을 이미 허용한 재방문 사용자", () => {
  test.use({
    permissions: ["geolocation", "camera"],
    geolocation: { latitude: 33.4996, longitude: 126.5312 },
  });

  test("셔터를 누르기 전에 위치를 미리 받아둔다", async ({ page }) => {
    await page.addInitScript(() => {
      const counted = window as unknown as { geoCalls: number };
      counted.geoCalls = 0;
      const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...args: Parameters<typeof original>) => {
        counted.geoCalls += 1;
        return original(...args);
      };
    });

    await page.goto("/");
    await expect(page.getByRole("button", { name: "촬영" })).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { geoCalls: number }).geoCalls))
      .toBeGreaterThan(0);
  });
});

test.describe("줌 슬라이더", () => {
  test.use({
    permissions: ["geolocation", "camera"],
    geolocation: { latitude: 33.4996, longitude: 126.5312 },
  });

  test("잡은 자리가 아니라 움직인 거리로 배율이 바뀐다", async ({ page }) => {
    await page.goto("/");
    const slider = page.getByRole("slider", { name: "줌 배율" });
    await expect(page.getByRole("button", { name: "촬영" })).toBeVisible();

    const readZoom = () => slider.evaluate((el) => Number((el as HTMLInputElement).value));
    const setZoom = (value: string) =>
      slider.evaluate((el, next) => {
        const input = el as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, next);
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);

    const track = (await slider.boundingBox())!;
    const centerX = track.x + track.width / 2;
    const centerY = track.y + track.height / 2;

    await setZoom("5");
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    expect(await readZoom()).toBe(5);

    await page.mouse.move(centerX - 60, centerY, { steps: 6 });
    const afterLeft = await readZoom();
    await page.mouse.move(centerX + 60, centerY, { steps: 6 });
    const afterRight = await readZoom();
    await page.mouse.up();

    expect(afterLeft).toBeLessThan(5);
    expect(afterRight).toBeGreaterThan(afterLeft);
  });
});
