import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  TRIALING: "bg-sky-50 text-sky-800 ring-sky-200",
  ACTIVE: "bg-teal-50 text-teal-800 ring-teal-200",
  PAST_DUE: "bg-amber-50 text-amber-900 ring-amber-200",
  SUSPENDED: "bg-red-50 text-red-800 ring-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLE[status] ?? STATUS_STYLE.CANCELLED,
      )}
    >
      {label}
    </span>
  );
}
