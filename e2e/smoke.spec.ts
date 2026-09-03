import { expect, test } from "@playwright/test";

// 로그인 없이도 확인 가능한 최소 스모크 — 3개 탭이 크래시 없이 뜨는지, 하단 네비가 동작하는지만 본다.
// 실제 촬영/기록/좋아요 플로우는 카메라 하드웨어·Supabase 인증이 필요해 여기서 다루지 않는다.

test("카메라 탭은 비로그인 상태에서도 로그인으로 막지 않는다", async ({ page }) => {
  // 이 케이스는 원래 셔터가 바로 보이는지를 봤는데, 진입 권한 게이트가 생기면서(`44ea260`,
  // FLOWS.md §1-1) 셔터 앞에 한 단계가 끼었다. 게이트를 지나야 나오는 셔터는 getUserMedia
  // 목업이 있어야 볼 수 있으므로(→ docs 남은 작업 목록 §2-8) 여기선 게이트까지만 본다.
  //
  // 지키려는 규칙은 그대로다 — 비로그인을 막는 건 **저장**뿐이고 촬영 진입은 아니다.
  // 여기에 로그인 안내가 뜨면 회귀다.
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

// 아래는 "사진첩은 본인 기록만"(ffbd26f) 이후 새로 생긴 규칙들.
// 비로그인 상태에서 확인 가능한 것만 다룬다 — 로그인 후 동작은 카카오 OAuth가 필요해 제외.

test("비로그인 사진첩은 '기록 없음'이 아니라 로그인 유도를 보여준다", async ({ page }) => {
  // 사진첩이 본인 기록만 보여주게 되면서 비로그인은 항상 빈 화면이 된다.
  // 여기서 "이 달엔 기록된 구름이 없어요"가 뜨면 원인을 가리는 회귀다(기록은 있고 내 게 없을 뿐).
  await page.goto("/calendar");
  await expect(page.getByText("로그인하면 내가 모은 구름을 볼 수 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "카카오로 로그인" })).toBeVisible();
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
  await page.route("**/rest/v1/entry_likes*", (route) => route.fulfill({ json: [] }));

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

test("피드 상세 모달은 닫힐 때 exit 애니메이션을 재생한다", async ({ page }) => {
  // 호출부가 `{selected && <Modal/>}`로 조건부 마운트하면 부모가 먼저 사라져서 Radix가
  // data-state="closed"로 넘어갈 틈이 없다 — enter만 나오고 exit는 조용히 씹힌다.
  // 프레임을 잡으려 하면 불안정하니 animationstart를 모아서 본다.
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
    // 게이트는 두 권한이 granted면 permissions.query만 보고 바로 통과시킨다 — 좌표를 한 번도
    // 안 받는다. 그 상태로 두면 셔터가 그때서야 fix를 요청해 최대 8초 멈춘다(게이트를 넣은
    // 목적이 바로 그 대기를 없애는 거였는데 재방문 사용자에겐 그대로였다).
    // CameraLive가 마운트될 때 미리 받아 브라우저 위치 캐시를 데우는 게 그 구멍을 막는다.
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
    // 게이트가 그냥 통과했다는 뜻 — 셔터가 바로 나온다.
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
    // 절대 위치 방식이면 보이는 건 가운데 배지뿐인데 값은 트랙 전체에 매핑돼 있어서,
    // 5x에서 배지를 잡는 순간 가운데 값(3x)으로 튄다 — 확대하려고 오른쪽으로 미는데
    // 먼저 축소되는 것처럼 느껴진다. 상대 드래그라야 어디를 잡든 현재 배율에서 이어진다.
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
    // 손가락을 대는 것만으로 배율이 변하면 안 된다.
    expect(await readZoom()).toBe(5);

    await page.mouse.move(centerX - 60, centerY, { steps: 6 });
    const afterLeft = await readZoom();
    await page.mouse.move(centerX + 60, centerY, { steps: 6 });
    const afterRight = await readZoom();
    await page.mouse.up();

    // 왼쪽으로 밀면 축소, 오른쪽으로 되돌리면 다시 확대.
    expect(afterLeft).toBeLessThan(5);
    expect(afterRight).toBeGreaterThan(afterLeft);
  });
});
