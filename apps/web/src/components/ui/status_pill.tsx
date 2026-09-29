import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  className?: string;
  /** "live" pulses, "static" does not (used inside reduced-motion contexts too). */
  pulse?: boolean;
}

/**
 * StatusPill — compact glass badge for status language
 * ("In active development", "Parser ready", …).
 */
export function StatusPill({ label, className, pulse = true }: StatusPillProps) {
  return (
    <span
      className={cn(
        "glass glass-1 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
        "text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink-100",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full bg-brick-400",
          pulse && "animate-[brick-pulse_2.4s_ease-in-out_infinite]",
        )}
      />
      {label}
    </span>
  );
}
