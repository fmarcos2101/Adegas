/** Ilustração full-bleed do PDV — plano visual dominante do hero. */
export function LandingHeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_70%_20%,#14b8a6_0%,transparent_45%),radial-gradient(ellipse_90%_70%_at_10%_90%,#0f766e_0%,transparent_50%),linear-gradient(155deg,#07111f_0%,#0f2f2c_42%,#0b1a24_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.35' stroke-width='1'%3E%3Cpath d='M0 36h72M36 0v72'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 35%, black 100%)",
        }}
      />
      <svg
        className="animate-nexo-drift absolute -right-[8%] top-[12%] h-[78%] w-auto max-w-none opacity-90 sm:right-[2%] lg:right-[6%]"
        viewBox="0 0 640 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="40"
          y="36"
          width="520"
          height="360"
          rx="18"
          fill="#0b1220"
          stroke="#2dd4bf"
          strokeOpacity="0.35"
          strokeWidth="2"
        />
        <rect x="40" y="36" width="520" height="48" rx="18" fill="#134e4a" />
        <rect x="40" y="66" width="520" height="18" fill="#134e4a" />
        <circle cx="68" cy="60" r="6" fill="#f87171" />
        <circle cx="90" cy="60" r="6" fill="#fbbf24" />
        <circle cx="112" cy="60" r="6" fill="#34d399" />
        <text
          x="140"
          y="66"
          fill="#ccfbf1"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="16"
          fontWeight="700"
        >
          NexoPDV · Caixa 01
        </text>
        <rect x="64" y="108" width="240" height="36" rx="8" fill="#1e293b" />
        <rect
          x="74"
          y="118"
          width="140"
          height="16"
          rx="4"
          fill="#334155"
        />
        <rect x="64" y="160" width="240" height="56" rx="10" fill="#115e59" />
        <rect x="80" y="174" width="120" height="10" rx="3" fill="#5eead4" />
        <rect
          x="80"
          y="192"
          width="80"
          height="8"
          rx="3"
          fill="#99f6e4"
          fillOpacity="0.5"
        />
        <rect x="64" y="232" width="240" height="56" rx="10" fill="#0f766e" />
        <rect x="80" y="246" width="150" height="10" rx="3" fill="#ccfbf1" />
        <rect
          x="80"
          y="264"
          width="90"
          height="8"
          rx="3"
          fill="#99f6e4"
          fillOpacity="0.5"
        />
        <rect x="64" y="304" width="240" height="56" rx="10" fill="#134e4a" />
        <rect x="80" y="318" width="110" height="10" rx="3" fill="#5eead4" />
        <rect x="340" y="108" width="196" height="252" rx="12" fill="#111827" />
        <text
          x="360"
          y="140"
          fill="#94a3b8"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="13"
        >
          Total da venda
        </text>
        <text
          x="360"
          y="188"
          fill="#f8fafc"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="42"
          fontWeight="700"
        >
          R$ 186
        </text>
        <rect x="360" y="220" width="156" height="40" rx="8" fill="#0f766e" />
        <text
          x="390"
          y="246"
          fill="#ecfdf5"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="15"
          fontWeight="600"
        >
          Finalizar (F2)
        </text>
        <rect
          x="360"
          y="276"
          width="156"
          height="36"
          rx="8"
          stroke="#334155"
          strokeWidth="2"
        />
        <rect
          x="360"
          y="324"
          width="72"
          height="20"
          rx="4"
          fill="#334155"
        />
        <rect
          x="444"
          y="324"
          width="72"
          height="20"
          rx="4"
          fill="#334155"
        />
        <ellipse
          cx="300"
          cy="430"
          rx="220"
          ry="28"
          fill="#000"
          fillOpacity="0.35"
        />
      </svg>
    </div>
  );
}
