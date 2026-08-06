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
  const title = brandName ?? APP_NAME;

  return (
    <header className="relative h-20 shrink-0 overflow-hidden border-b border-slate-800/60 bg-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(13,148,136,0.35)_0%,_transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex h-full items-center justify-between px-6">
        <div className="leading-tight">
          <p className="text-xl font-extrabold tracking-tight text-white drop-shadow">
            {title}
          </p>
          {subtitle ? (
            <p className="text-xs font-medium text-teal-100/90">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
