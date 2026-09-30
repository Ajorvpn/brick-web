/**
 * Procedural brick PBR textures — generated once with canvas, deterministic
 * (seeded), fully local, no network assets.
 *
 * IMPORTANT: these maps describe ONE brick face (a single fired-clay unit),
 * NOT a wall of bricks. The wall illusion comes from laying many instances;
 * painting mortar joints onto the geometry would make a single brick read
 * as a wall segment. Target look: matte terracotta with firing variation,
 * fine grain, pores and subtle edge darkening — architectural-viz quality,
 * not painted orange.
 */

export interface brick_texture_set {
  /** albedo — full terracotta color baked in */
  map: HTMLCanvasElement;
  /** roughness — near-white (matte) with subtle variation */
  roughness_map: HTMLCanvasElement;
  /** bump — grayscale micro-relief (grain, pores, striations) */
  bump_map: HTMLCanvasElement;
}

const FACE_W = 512;
const FACE_H = 256;

/** Deterministic LCG — seeded, pure (no Math.random). */
function make_rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * create_brick_texture_set — one brick face as a PBR map set.
 * Every face of the canonical geometry samples this once (UV 0..1).
 */
export function create_brick_texture_set(seed = 0x62726963): brick_texture_set {
  const albedo = document.createElement("canvas");
  albedo.width = FACE_W;
  albedo.height = FACE_H;
  const ctx = albedo.getContext("2d")!;

  const rough = document.createElement("canvas");
  rough.width = FACE_W;
  rough.height = FACE_H;
  const rctx = rough.getContext("2d")!;

  const bump = document.createElement("canvas");
  bump.width = FACE_W;
  bump.height = FACE_H;
  const bctx = bump.getContext("2d")!;

  const rand = make_rng(seed);

  // --- base: light matte terracotta (instance tints may darken it) -------
  ctx.fillStyle = "oklch(62% 0.095 46)";
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  rctx.fillStyle = "#ececec"; // roughness ≈ 0.93 — matte fired clay
  rctx.fillRect(0, 0, FACE_W, FACE_H);
  bctx.fillStyle = "#7d7d7d"; // neutral mid height
  bctx.fillRect(0, 0, FACE_W, FACE_H);

  // --- large-scale firing variation: soft warm/cool blotches -------------
  for (let i = 0; i < 6; i++) {
    const bx = rand() * FACE_W;
    const by = rand() * FACE_H;
    const br = 60 + rand() * 130;
    const dark = rand() > 0.45;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    if (dark) {
      g.addColorStop(0, `rgba(96,52,34,${0.05 + rand() * 0.07})`);
    } else {
      g.addColorStop(0, `rgba(255,214,180,${0.04 + rand() * 0.06})`);
    }
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FACE_W, FACE_H);

    // roughness follows the firing patches slightly
    const rg = rctx.createRadialGradient(bx, by, 0, bx, by, br);
    rg.addColorStop(0, dark ? "rgba(255,255,255,0.10)" : "rgba(140,140,140,0.22)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    rctx.fillStyle = rg;
    rctx.fillRect(0, 0, FACE_W, FACE_H);
  }

  // --- extrusion striations: faint horizontal bands ----------------------
  for (let i = 0; i < 7; i++) {
    const y = rand() * FACE_H;
    const h = 1.5 + rand() * 3;
    const a = 0.03 + rand() * 0.05;
    ctx.fillStyle =
      rand() > 0.5 ? `rgba(255,220,190,${a})` : `rgba(70,35,22,${a})`;
    ctx.fillRect(0, y, FACE_W, h);
    bctx.fillStyle = `rgba(${rand() > 0.5 ? 160 : 90},${rand() > 0.5 ? 160 : 90},${rand() > 0.5 ? 160 : 90},0.5)`;
    bctx.fillRect(0, y, FACE_W, h);
  }

  // --- fine grain: dense micro speckle -----------------------------------
  const grain = 2200;
  for (let i = 0; i < grain; i++) {
    const sx = rand() * FACE_W;
    const sy = rand() * FACE_H;
    const r = 0.3 + rand() * 1.0;
    const light = rand() > 0.5;
    const a = 0.03 + rand() * 0.07;
    ctx.fillStyle = light
      ? `rgba(255,226,200,${a})`
      : `rgba(52,26,16,${a})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // bump: grain pits and flecks
    const bv = light ? 150 + rand() * 40 : 80 + rand() * 30;
    bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bctx.beginPath();
    bctx.arc(sx, sy, r, 0, Math.PI * 2);
    bctx.fill();

    // sparse smoother clay flecks in roughness
    if (rand() > 0.86) {
      rctx.fillStyle = `rgba(150,150,150,${0.2 + rand() * 0.25})`;
      rctx.beginPath();
      rctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
      rctx.fill();
    }
  }

  // --- pores: small soft dark craters ------------------------------------
  for (let i = 0; i < 55; i++) {
    const sx = rand() * FACE_W;
    const sy = rand() * FACE_H;
    const r = 1.2 + rand() * 2.6;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(38,18,10,${0.35 + rand() * 0.3})`);
    g.addColorStop(0.7, `rgba(60,30,18,${0.18 + rand() * 0.15})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    const bg = bctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    bg.addColorStop(0, "rgb(45,45,45)");
    bg.addColorStop(1, "rgba(125,125,125,0)");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(sx, sy, r, 0, Math.PI * 2);
    bctx.fill();
  }

  // --- edge darkening: soft worn border (chip illusion, kept subtle) -----
  const edge = 10;
  const eg = ctx.createLinearGradient(0, 0, 0, FACE_H);
  eg.addColorStop(0, "rgba(55,26,14,0.20)");
  eg.addColorStop(0.12, "rgba(0,0,0,0)");
  eg.addColorStop(0.88, "rgba(0,0,0,0)");
  eg.addColorStop(1, "rgba(55,26,14,0.22)");
  ctx.fillStyle = eg;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  const egx = ctx.createLinearGradient(0, 0, FACE_W, 0);
  egx.addColorStop(0, "rgba(55,26,14,0.16)");
  egx.addColorStop(edge / FACE_W, "rgba(0,0,0,0)");
  egx.addColorStop(1 - edge / FACE_W, "rgba(0,0,0,0)");
  egx.addColorStop(1, "rgba(55,26,14,0.16)");
  ctx.fillStyle = egx;
  ctx.fillRect(0, 0, FACE_W, FACE_H);

  // bump edge recess so bevels catch light like worn clay
  bctx.strokeStyle = "rgba(70,70,70,0.55)";
  bctx.lineWidth = 3;
  bctx.strokeRect(1.5, 1.5, FACE_W - 3, FACE_H - 3);

  return { map: albedo, roughness_map: rough, bump_map: bump };
}

/**
 * create_mortar_texture — the bed the bricks sit on.
 *
 * The gaps between units are mortar, never raw background: a sanded
 * cement-gray field with coarse grain, darker where the joint is deepest.
 * Tiles seamlessly because the pattern never depends on alignment.
 */
export function create_mortar_texture(seed = 0x6d6f7274): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = make_rng(seed);

  ctx.fillStyle = "#4a4642";
  ctx.fillRect(0, 0, size, size);

  // coarse sand grain
  for (let i = 0; i < 4200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.4 + rand() * 1.5;
    const v = rand();
    ctx.fillStyle =
      v > 0.62
        ? `rgba(196,190,182,${0.05 + rand() * 0.12})`
        : `rgba(24,22,20,${0.05 + rand() * 0.14})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // trowel smears — broad, very low contrast
  for (let i = 0; i < 8; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 30 + rand() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rand() > 0.5 ? "rgba(214,208,198,0.05)" : "rgba(18,16,14,0.07)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  // recessed joint shading — the bed reads deeper than the brick faces
  const vign = ctx.createLinearGradient(0, 0, 0, size);
  vign.addColorStop(0, "rgba(0,0,0,0.16)");
  vign.addColorStop(1, "rgba(0,0,0,0.26)");
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

