/** Atmosfera clara com a logo MAF como plano visual dominante. */
export function LandingHeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(180,186,198,0.35),transparent_55%),linear-gradient(160deg,#f7f8fa_0%,#e8eaef_45%,#f4f5f7_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-opacity='0.06' stroke-width='1'%3E%3Cpath d='M0 36h72M36 0v72'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 40%, black 100%)",
        }}
      />
      <div className="animate-maf-drift absolute -right-[6%] top-[10%] hidden w-[min(50vw,520px)] sm:block lg:right-[4%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-maf.png"
          alt=""
          className="h-auto w-full drop-shadow-[0_28px_50px_rgba(0,0,0,0.28)]"
        />
      </div>
    </div>
  );
}
