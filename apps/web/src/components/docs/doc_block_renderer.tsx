import { StatusBadge } from "@/components/ui/status_badge";
import type { doc_block } from "@/content/docs_content";

/** DocBlockRenderer — readable-first rendering of typed doc blocks. */
export function DocBlockRenderer({ block }: { block: doc_block }) {
  switch (block.kind) {
    case "h":
      return (
        <h2 className="mt-12 scroll-mt-28 text-xl font-semibold tracking-tight text-ink-050">
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p className="mt-4 text-[0.95rem] leading-[1.75] text-ink-200">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul className="mt-4 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[0.92rem] leading-relaxed text-ink-200">
              <span aria-hidden className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-brick-400" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-ink-950/80 p-4 font-mono text-[0.8rem] leading-relaxed text-ink-100">
          <code>{block.code}</code>
        </pre>
      );
    case "callout":
      return (
        <aside
          className={
            "mt-6 rounded-xl border p-4 text-[0.88rem] leading-relaxed " +
            (block.tone === "warn"
              ? "border-brick-300/30 bg-brick-400/8 text-brick-100"
              : "border-cyan-glow/25 bg-cyan-glow/8 text-ink-100")
          }
        >
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-300">
            {block.tone === "warn" ? "Important" : "Note"}
          </p>
          <p className="mt-1.5">{block.text}</p>
        </aside>
      );
    case "status_table":
      return (
        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-white/10 bg-white/4">
                <th className="px-4 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-400">
                  Component
                </th>
                <th className="px-4 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-400">
                  Status
                </th>
                <th className="hidden px-4 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-400 sm:table-cell">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.label} className="border-b border-white/6 last:border-0">
                  <td className="px-4 py-3 text-ink-100">{row.label}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-ink-400 sm:table-cell">
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
