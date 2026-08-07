/** Atmosfera clara com a logo MAF (chrome) como plano visual dominante. */
export function LandingHeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_75%_30%,rgba(197,202,211,0.45),transparent_58%),linear-gradient(160deg,#fbfbfc_0%,#eef0f4_42%,#f6f7f9_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-opacity='0.05' stroke-width='1'%3E%3Cpath d='M0 36h72M36 0v72'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 38%, black 100%)",
        }}
      />
      <div className="animate-maf-drift absolute -right-[4%] top-[12%] hidden w-[min(52vw,560px)] sm:block lg:right-[2%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-maf.png"
          alt=""
          className="h-auto w-full drop-shadow-[0_24px_48px_rgba(15,15,20,0.22)]"
        />
      </div>
    </div>
  );
}
