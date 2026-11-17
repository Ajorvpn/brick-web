/**
 * Vector → mask → contour. The stamps are authored as simple closed
 * polygons (no SVG parser, no font, no third-party path data); this module
 * rasterises them to a coverage field, and traces that field back into
 * contours for ExtrudeGeometry — so the texture relief and the 3D relief of
 * the keystone are guaranteed to be the same silhouette.
 */

const TAU = Math.PI * 2;

export function circle(cx, cy, r, n = 72) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

export function ellipse(cx, cy, rx, ry, rot = 0, n = 64) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return pts;
}

/** Star / scalloped disc: alternating outer and inner radii. */
export function star(cx, cy, rOut, rIn, points, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i / (points * 2)) * TAU;
    const r = i % 2 === 0 ? rOut : rIn;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function arc(cx, cy, r, from, to, seg = 10) {
  const pts = [];
  for (let i = 1; i <= seg; i++) {
    const a = from + ((to - from) * i) / seg;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** Tapered limb (leg, tail segment, sword blade) with rounded caps. */
export function limb(x1, y1, x2, y2, w1, w2, seg = 8) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const a = Math.atan2(ny, nx);
  const pts = [];
  pts.push([x1 + nx * w1, y1 + ny * w1]);
  pts.push([x2 + nx * w2, y2 + ny * w2]);
  pts.push(...arc(x2, y2, w2, a, a + Math.PI, seg));
  pts.push([x1 - nx * w1, y1 - ny * w1]);
  pts.push(...arc(x1, y1, w1, a + Math.PI, a + TAU, seg));
  return pts;
}

/** Quadratic bezier tube — the lion's tail. */
export function tube(p0, p1, p2, w0, w2, steps = 20) {
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
    const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
    const tx = 2 * mt * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const ty = 2 * mt * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l;
    const ny = tx / l;
    const w = w0 + (w2 - w0) * t;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  }
  return [...left, ...right.reverse()];
}

export function polygon(points) {
  return points;
}

/**
 * rasterize — union of simple polygons into a 0..1 coverage field.
 *
 * The unit box is placed as a SQUARE of `size` px at (ox, oy), so a circle
 * in the artwork stays circular on a 4:1 brick face instead of becoming an
 * ellipse (the face UV is 1:1 to the texture, not to the artwork).
 */
export function rasterize(subpaths, w, h, { ox = 0, oy = 0, size = null, mask = null } = {}) {
  const out = mask ?? new Float32Array(w * h);
  const s = size ?? Math.min(w, h);
  const SS = 4; // sub-rows per pixel row
  const scale = (p) => [ox + p[0] * s, oy + p[1] * s];

  for (const subpath of subpaths) {
    const pts = subpath.map(scale);
    // horizontal scanlines, supersampled vertically, with analytic x coverage
    for (let row = 0; row < h; row++) {
      const rowBase = row * w;
      for (let sy = 0; sy < SS; sy++) {
        const y = row + (sy + 0.5) / SS;
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          if (a[1] <= y !== b[1] <= y) {
            const t = (y - a[1]) / (b[1] - a[1]);
            xs.push(a[0] + t * (b[0] - a[0]));
          }
        }
        if (xs.length < 2) continue;
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          let x0 = xs[k];
          let x1 = xs[k + 1];
          if (x1 <= 0 || x0 >= w) continue;
          x0 = Math.max(0, x0);
          x1 = Math.min(w, x1);
          const wgt = 1 / SS;
          const i0 = Math.floor(x0);
          const i1 = Math.ceil(x1);
          if (i1 - i0 <= 1) {
            out[rowBase + Math.min(i0, w - 1)] += (x1 - x0) * wgt;
          } else {
            out[rowBase + i0] += (i0 + 1 - x0) * wgt;
            for (let x = i0 + 1; x < i1 - 1; x++) out[rowBase + x] += wgt;
            out[rowBase + i1 - 1] += (x1 - (i1 - 1)) * wgt;
          }
        }
      }
    }
  }

  for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i]);
  return out;
}

/**
 * traceContours — marching squares over a coverage mask.
 *
 * Emits closed polygons in mask pixel coordinates. Used to turn the emblem
 * artwork into the polygons that become ExtrudeGeometry shapes, so the gold
 * relief is the exact silhouette that the normal map was baked from.
 */
export function traceContours(mask, w, h, threshold = 0.5) {
  const at = (x, y) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x] >= threshold ? 1 : 0;

  // Segment endpoints live on grid edges, which gives us a stable identity
  // for stitching: vertical edge (x,y) and horizontal edge (x,y).
  const vkey = (x, y) => `v${x},${y}`;
  const hkey = (x, y) => `h${x},${y}`;
  const pos = new Map();
  const setV = (x, y) => {
    const k = vkey(x, y);
    if (!pos.has(k)) pos.set(k, [x, y + 0.5]);
    return k;
  };
  const setH = (x, y) => {
    const k = hkey(x, y);
    if (!pos.has(k)) pos.set(k, [x + 0.5, y]);
    return k;
  };

  const segs = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x, y);
      const tr = at(x + 1, y);
      const br = at(x + 1, y + 1);
      const bl = at(x, y + 1);
      const code = tl | (tr << 1) | (br << 2) | (bl << 3);
      if (code === 0 || code === 15) continue;
      const t = setH(x, y);
      const r = setV(x + 1, y);
      const b = setH(x, y + 1);
      const l = setV(x, y);
      const push = (a, c) => segs.push([a, c]);
      switch (code) {
        case 1:
        case 14:
          push(l, t);
          break;
        case 2:
        case 13:
          push(t, r);
          break;
        case 3:
        case 12:
          push(l, r);
          break;
        case 4:
        case 11:
          push(r, b);
          break;
        case 6:
        case 9:
          push(t, b);
          break;
        case 7:
        case 8:
          push(l, b);
          break;
        case 5:
          // saddle: resolve with the cell centre average
          if ((tl + tr + br + bl) / 4 >= threshold) {
            push(l, t);
            push(r, b);
          } else {
            push(l, b);
            push(t, r);
          }
          break;
        case 10:
          if ((tl + tr + br + bl) / 4 >= threshold) {
            push(t, r);
            push(b, l);
          } else {
            push(t, l);
            push(b, r);
          }
          break;
        default:
          break;
      }
    }
  }

  // Stitch segments into loops via undirected adjacency.
  const adj = new Map();
  for (const [a, b] of segs) {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  }

  const used = new Set();
  const loops = [];
  const edgeId = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  for (const [a, b] of segs) {
    if (used.has(edgeId(a, b))) continue;
    const loop = [a];
    let prev = null;
    let cur = a;
    let next = b;
    used.add(edgeId(cur, next));
    loop.push(next);
    while (next !== a) {
      prev = cur;
      cur = next;
      const options = (adj.get(cur) ?? []).filter(
        (n) => n !== prev && !used.has(edgeId(cur, n)),
      );
      if (options.length === 0) break;
      next = options[0];
      used.add(edgeId(cur, next));
      loop.push(next);
      if (loop.length > 2_000_000) break;
    }
    // The walk returns to its start node; a closed polygon must not carry the
    // duplicate point (simplify() would see a zero-length baseline).
    if (loop.length > 8 && next === a) {
      const pts = loop.map((k) => pos.get(k));
      if (pts[0] === pts[pts.length - 1]) pts.pop();
      loops.push(pts);
    }
  }
  return loops;
}

export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

/** Douglas–Peucker — keeps the extruded emblem from carrying 20k points. */
export function simplify(points, epsilon = 1) {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop();
    let maxD = -1;
    let idx = -1;
    const a = points[i0];
    const b = points[i1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    for (let i = i0 + 1; i < i1; i++) {
      const p = points[i];
      const d = Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon && idx !== -1) {
      keep[idx] = 1;
      stack.push([i0, idx], [idx, i1]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}