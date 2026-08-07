/** Atmosfera clara; a logo fica como marca de fundo, sem competir com os planos. */
export function LandingHeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_80%_0%,rgba(197,202,211,0.4),transparent_55%),linear-gradient(165deg,#fbfbfc_0%,#eef0f4_48%,#f6f7f9_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-opacity='0.05' stroke-width='1'%3E%3Cpath d='M0 36h72M36 0v72'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="animate-maf-drift absolute -right-[8%] top-[-6%] w-[min(42vw,380px)] opacity-30 sm:opacity-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-maf.png"
          alt=""
          className="h-auto w-full drop-shadow-[0_20px_40px_rgba(15,15,20,0.18)]"
        />
      </div>
    </div>
  );
}
