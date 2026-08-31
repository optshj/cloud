// FSD app 레이어: 전역 스타일(globals.css)과 루트 레이아웃(providers/폰트/metadata)을 모아둔다.
// Next.js 라우팅 자체는 프로젝트 루트의 app/ 디렉터리가 담당한다(src/app은 app/이 루트에 있으면
// Next가 라우팅 후보에서 무시하므로, FSD의 app 레이어 용도로만 재사용해도 충돌이 없다).
export { default as RootLayout, metadata } from "./ui/RootLayout";
