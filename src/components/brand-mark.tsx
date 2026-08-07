import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  showWordmark = true,
  size = 44,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* SVG local — <img> evita restrições do next/image com SVG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-maf.svg"
        alt={APP_NAME}
        width={size}
        height={Math.round(size * 0.5)}
        className="h-auto"
      />
      {showWordmark ? (
        <span className="font-display text-lg font-bold tracking-[0.14em] text-white">
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}
