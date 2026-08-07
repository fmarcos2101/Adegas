import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  showWordmark = true,
  size = 48,
  light = false,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
  /** texto escuro (fundos claros) */
  light?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={size <= 56 ? "/logo-maf-icon.png" : "/logo-maf.png"}
        alt={APP_NAME}
        width={size}
        height={Math.round(size * 0.62)}
        className="h-auto object-contain"
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-display text-lg font-bold tracking-[0.14em]",
            light ? "text-zinc-900" : "text-white",
          )}
        >
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}
