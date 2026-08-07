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
    <header className="relative h-20 shrink-0 overflow-hidden border-b border-white/10 bg-[#070708]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 120% at 10% 50%, rgba(220,225,235,0.12), transparent 55%), radial-gradient(ellipse 40% 80% at 90% 20%, rgba(255,255,255,0.06), transparent 50%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />
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
            <BrandMark size={44} />
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
