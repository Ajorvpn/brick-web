import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  as?: "h2" | "h3";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.22em] text-brick-300">
        {eyebrow}
      </p>
      <Tag className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-050 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </Tag>
      {lede ? (
        <p className="mt-5 text-pretty text-base leading-relaxed text-ink-300 sm:text-lg">
          {lede}
        </p>
      ) : null}
    </div>
  );
}
