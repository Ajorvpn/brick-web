import { cn } from "@/lib/utils";
import type { build_status } from "@/content/project_facts";

/**
 * BrickStageTile — the canonical brick visual for stage cards.
 * Same geometry/proportions for every state; only the material treatment
 * changes: implemented = solid clay, in-progress = warm illumination,
 * planned = ghosted outline. A tiny mortar joint underline keeps the
 * masonry language present.
 */
export function BrickStageTile({
  status,
  fill = 1,
  className,
}: {
  status: build_status;
  /** 0..1 how much of the brick body is present (visual metaphor only) */
  fill?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("relative h-16 select-none", className)}
    >
      {/* mortar joint under the brick */}
      <div className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-white/6" />

      {/* the brick */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 overflow-hidden rounded-[7px] border transition-colors",
          status === "implemented" &&
            "border-white/12 bg-gradient-to-br from-[#a85a3c] via-[#96502f] to-[#7c3f26] shadow-[inset_0_1px_0_rgb(255_235_220/0.22),inset_0_-8px_14px_-8px_rgb(40_12_4/0.55),0_6px_16px_-6px_rgb(0_0_0/0.5)]",
          status === "in-progress" &&
            "border-brick-300/40 bg-gradient-to-br from-[#c46a42] via-[#b25a34] to-[#96482a] shadow-[inset_0_1px_0_rgb(255_240_225/0.3),0_0_22px_-4px_rgb(224_85_47/0.5),0_6px_16px_-6px_rgb(0_0_0/0.5)]",
          status === "planned" &&
            "border-dashed border-white/20 bg-white/3",
        )}
        style={{ height: `${Math.max(fill * 100, 22)}%` }}
      >
        {/* firing variation: soft horizontal banding */}
        {status !== "planned" && (
          <>
            <div className="absolute inset-x-0 top-[30%] h-px bg-white/8" />
            <div className="absolute inset-x-0 top-[62%] h-px bg-black/10" />
            <div className="absolute left-[18%] top-[24%] size-[3px] rounded-full bg-black/20" />
            <div className="absolute right-[30%] top-[58%] size-[2px] rounded-full bg-white/25" />
          </>
        )}
        {status === "in-progress" && (
          <div className="absolute inset-0 animate-[brick-pulse_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        )}
      </div>
    </div>
  );
}
