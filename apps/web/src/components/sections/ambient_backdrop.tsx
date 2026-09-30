/**
 * AmbientBackdrop — the light behind every glass surface.
 *
 * Glass is a lens: it has nothing to show unless something sits behind it.
 * The v2 build put every panel on a flat near-black page, so the blur had
 * nothing to reveal and each panel read as a flat dark rectangle. This is the
 * missing light source — four large, slow-drifting colour masses fixed behind
 * the document (see styles/aurora.css), animated in CSS only: no canvas, no
 * JavaScript per frame, everything on the compositor.
 *
 * Purely decorative: aria-hidden, pointer-events none, z-index -1 so it sits
 * above the page background and below all content.
 */
export function AmbientBackdrop() {
  return (
    <div className="aurora" aria-hidden="true" data-testid="ambient-backdrop">
      <div className="aurora-blob aurora-blob-clay" />
      <div className="aurora-blob aurora-blob-cyan" />
      <div className="aurora-blob aurora-blob-violet" />
      <div className="aurora-blob aurora-blob-ember" />
      <div className="aurora-veil" />
    </div>
  );
}
