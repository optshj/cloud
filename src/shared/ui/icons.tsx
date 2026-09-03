import {
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Flag,
  Heart,
  Images,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";

type IconProps = { className?: string };

export const GearIcon = Settings;
export const CameraIcon = Camera;
export const CameraOffIcon = CameraOff;
export const RefreshIcon = RefreshCw;
export const ImagesIcon = Images;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const XIcon = X;
export const FlagIcon = Flag;

export function HeartIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return <Heart className={className} fill={filled ? "currentColor" : "none"} />;
}

export function CloudIcon({ className }: IconProps) {
  return <Cloud className={className} fill="currentColor" strokeWidth={0} />;
}

const ROUGH_CLOUD_D =
  "M26 66 C16 64 15 50 25 47 C22 36 34 28 43 33 C47 23 64 22 69 33 C80 32 86 44 79 51 C88 55 85 66 75 66 C74 71 66 73 61 69 C55 74 43 74 38 69 C33 72 27 70 26 66 Z";

// 아이콘 시안 v3 "9e — GRAPHITE" 채택안
export function LogoIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <rect x="8" y="8" width="88" height="88" rx="14" fill="#17151c" />
      <rect
        x="4"
        y="4"
        width="88"
        height="88"
        rx="14"
        fill="#f6f1e6"
        stroke="#17151c"
        strokeWidth="4"
      />
      <path
        d="M13 17 L13 25 M13 17 L21 17"
        fill="none"
        stroke="#6f6980"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M83 79 L83 71 M83 79 L75 79"
        fill="none"
        stroke="#6f6980"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d={ROUGH_CLOUD_D} fill="#4a4555" transform="translate(-1,2.5)" />
      <path
        d={ROUGH_CLOUD_D}
        fill="#eceef4"
        stroke="#4a4555"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        transform="translate(-4,-0.5)"
      />
    </svg>
  );
}
