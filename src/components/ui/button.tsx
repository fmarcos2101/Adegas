import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "destructive" | "success";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default:
    "maf-chrome-btn border-0 text-[#0a0a0c] hover:brightness-105",
  outline:
    "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10",
  ghost: "text-zinc-300 hover:bg-white/5 hover:text-white",
  destructive: "bg-red-700 text-white hover:bg-red-600",
  success: "bg-emerald-700 text-white hover:bg-emerald-600",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
