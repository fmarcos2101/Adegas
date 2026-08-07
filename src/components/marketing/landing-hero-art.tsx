/** Atmosfera chrome + fumaça + monograma MAF no plano visual do hero. */
export function LandingHeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="maf-smoke absolute inset-0" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.2' stroke-width='1'%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 65% 40%, black, transparent 75%)",
        }}
      />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />

      <div className="animate-maf-drift absolute right-[-4%] top-[14%] hidden w-[min(52vw,560px)] sm:block lg:right-[6%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-maf.svg"
          alt=""
          className="h-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)]"
        />
        <div className="mx-auto mt-6 h-8 w-2/3 rounded-[100%] bg-black/50 blur-xl" />
      </div>
    </div>
  );
}
