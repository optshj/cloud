import Link from "next/link";
import { GearIcon, LogoIcon } from "@/shared/ui/icons";
import { BRUTAL_SM } from "@/shared/ui/tokens";

export function TopHeader({ headerClass }: { headerClass: string }) {
  return (
    <header
      className={`flex items-center justify-between gap-2 border-b-[3px] border-black px-4 py-3 ${headerClass}`}
    >
      <div className="flex items-center gap-2">
        <LogoIcon className="h-10 w-10" />
      </div>
      <Link
        href="/settings"
        aria-label="설정"
        className={`${BRUTAL_SM} flex h-10 w-10 items-center justify-center bg-amber-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
      >
        <GearIcon className="h-4 w-4" />
      </Link>
    </header>
  );
}
