import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brick-500 text-white shadow-[0_8px_24px_-8px_rgb(196_72_32/0.55)] hover:bg-brick-400 active:bg-brick-600 border border-brick-300/30",
  secondary:
    "glass glass-2 text-ink-050 hover:bg-white/8 hover:border-white/25",
  ghost:
    "text-ink-200 hover:text-ink-050 hover:bg-white/6 border border-transparent",
};

const sizeClasses: Record<Size, string> = {
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-[0.95rem] gap-2.5",
};

const base =
  "inline-flex items-center justify-center rounded-full font-medium tracking-tight transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-[var(--ease-glass)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brick-300 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

export interface BrickButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export const BrickButton = forwardRef<HTMLButtonElement, BrickButtonProps>(
  function BrickButton({ variant = "primary", size = "md", className, children, type, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(base, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

export interface BrickButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export const BrickButtonLink = forwardRef<HTMLAnchorElement, BrickButtonLinkProps>(
  function BrickButtonLink({ variant = "primary", size = "md", className, children, ...props }, ref) {
    return (
      <a
        ref={ref}
        className={cn(base, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </a>
    );
  },
);
