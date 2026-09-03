import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  CameraIcon,
  CameraOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  FlagIcon,
  GearIcon,
  HeartIcon,
  ImagesIcon,
  LogoIcon,
  RefreshIcon,
  XIcon,
} from "./icons";

// lucide 아이콘을 이름만 바꿔 재수출하는 게 대부분이고, 서비스 고유 모양(구름·로고)만 직접 그린다.
// 호출부가 lucide를 직접 import하지 않게 이 파일 하나로 모은다 — 아이콘 세트를 갈아끼울 때
// 고칠 자리가 여기뿐이다.
const ENTRIES = [
  { name: "LogoIcon", Icon: LogoIcon },
  { name: "CloudIcon", Icon: CloudIcon },
  { name: "CameraIcon", Icon: CameraIcon },
  { name: "CameraOffIcon", Icon: CameraOffIcon },
  { name: "ImagesIcon", Icon: ImagesIcon },
  { name: "GearIcon", Icon: GearIcon },
  { name: "RefreshIcon", Icon: RefreshIcon },
  { name: "ChevronLeftIcon", Icon: ChevronLeftIcon },
  { name: "ChevronRightIcon", Icon: ChevronRightIcon },
  { name: "XIcon", Icon: XIcon },
  { name: "FlagIcon", Icon: FlagIcon },
];

const IconGallery = () => (
  <div className="grid grid-cols-4 gap-4">
    {ENTRIES.map(({ name, Icon }) => (
      <div key={name} className="flex flex-col items-center gap-2 bg-white p-3">
        <Icon className="h-7 w-7" />
        <span className="text-[10px] break-all text-neutral-600">{name}</span>
      </div>
    ))}
    <div className="flex flex-col items-center gap-2 bg-white p-3">
      <HeartIcon className="h-7 w-7 text-rose-500" filled />
      <span className="text-[10px] text-neutral-600">HeartIcon filled</span>
    </div>
    <div className="flex flex-col items-center gap-2 bg-white p-3">
      <HeartIcon className="h-7 w-7" />
      <span className="text-[10px] text-neutral-600">HeartIcon</span>
    </div>
  </div>
);

const meta = {
  title: "shared/ui/Icons",
  component: IconGallery,
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  name: "전체",
};
