import { cn } from "@/lib/utils";
import type { build_status } from "@/content/project_facts";

const status_style: Record<build_status, string> = {
  implemented: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  "in-progress": "border-brick-300/30 bg-brick-400/15 text-brick-100",
  planned: "border-white/15 bg-white/5 text-ink-300",
};

const status_label: Record<build_status, string> = {
  implemented: "Implemented",
  "in-progress": "In progress",
  planned: "Planned",
};

/** StatusBadge — the implemented/in-progress/planned visual vocabulary. */
export function StatusBadge({
  status,
  className,
}: {
  status: build_status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em]",
        status_style[status],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1 rounded-full",
          status === "implemented" && "bg-emerald-300",
          status === "in-progress" && "animate-[brick-pulse_2.4s_ease-in-out_infinite] bg-brick-400",
          status === "planned" && "bg-ink-400",
        )}
      />
      {status_label[status]}
    </span>
  );
}
