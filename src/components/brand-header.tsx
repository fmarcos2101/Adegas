import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/constants";

export function BrandHeader({
  subtitle,
  brandName,
  children,
}: {
  subtitle?: string;
  brandName?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="maf-dark-bar relative h-20 shrink-0 overflow-hidden border-b border-white/10">
      <div className="relative z-10 flex h-full items-center justify-between px-6">
        <div className="leading-tight">
          {brandName && brandName !== APP_NAME ? (
            <>
              <p className="font-display text-xs font-semibold tracking-[0.2em] text-zinc-400">
                {APP_NAME}
              </p>
              <p className="text-lg font-semibold tracking-tight text-white">
                {brandName}
              </p>
            </>
          ) : (
            <BrandMark size={52} />
          )}
          {subtitle ? (
            <p className="mt-0.5 text-xs font-medium text-zinc-400">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
