export function BrandHeader({
  subtitle,
  children,
}: {
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative h-20 shrink-0 overflow-hidden border-b border-pink-900/40">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-adega.png')" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-pink-900/30"
        aria-hidden
      />
      <div className="relative z-10 flex h-full items-center justify-between px-6">
        <div className="leading-tight">
          <p className="text-xl font-extrabold uppercase tracking-tight text-white drop-shadow">
            Adega <span className="text-pink-400">Faixa Rosa</span>
          </p>
          {subtitle ? (
            <p className="text-xs font-medium text-pink-100/90">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
