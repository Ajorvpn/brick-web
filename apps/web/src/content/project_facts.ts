/**
 * Repository-verified facts about Brick VPN.
 *
 * Every claim rendered by the site originates here. `source` points at the
 * proving document in the Brick Flutter/Dart repository. No marketing
 * invention happens in components.
 *
 * Verified against ../brick-vpn/AI_ROLES/PROJECT_STATE.md (2026-09-28),
 * ROADMAP.md, ARCHITECTURE.md, SECURITY.md, README.md.
 */

export const REPO_URL = "https://github.com/Ajorvpn/brick";
export const REPO_ISSUES_URL = `${REPO_URL}/issues`;
export const REPO_LICENSE_URL = `${REPO_URL}/blob/master/LICENSE`;
export const PROJECT_EMAIL = "ajorpvn@gmail.com";

/* ------------------------------------------------------------------ */

export interface brick_fact {
  id: string;
  title: string;
  body: string;
  source: string;
}

/** §21 "What is Brick" editorial facts. */
export const WHAT_IS_BRICK_FACTS: brick_fact[] = [
  {
    id: "free",
    title: "Free",
    body: "Designed as a free project — no accounts, no client paywalls.",
    source: "README.md",
  },
  {
    id: "open-source",
    title: "Open source",
    body: "Every line is public, licensed GPL v3 so forks must stay open.",
    source: "LICENSE / ARCHITECTURE.md",
  },
  {
    id: "privacy",
    title: "Privacy-first",
    body: "No telemetry or analytics by default; logs silence themselves in release builds.",
    source: "ARCHITECTURE.md §1, SECURITY.md §10",
  },
  {
    id: "android-first",
    title: "Android-first",
    body: "One Flutter codebase targeting Android first; desktop and iOS are planned later phases.",
    source: "ARCHITECTURE.md §2",
  },
];

/** §22 Why Brick — four principles, each with a distinct visual identity. */
export interface why_brick_principle {
  id: string;
  title: string;
  body: string;
  /** selects the bespoke visual treatment */
  visual: "lens" | "layers" | "flow" | "open";
}

export const WHY_BRICK_PRINCIPLES: why_brick_principle[] = [
  {
    id: "privacy",
    title: "Privacy first",
    body: "No telemetry, no analytics, configs classified as secrets. Privacy is an architecture, not a feature.",
    visual: "lens",
  },
  {
    id: "free",
    title: "Free",
    body: "No accounts, no paywalls, no ads. Funded by conviction, not conversion.",
    visual: "open",
  },
  {
    id: "open-source",
    title: "Open source",
    body: "GPL v3, public architecture docs, decisions written down. Trust through visibility.",
    visual: "layers",
  },
  {
    id: "performance",
    title: "Performance",
    body: "A native sing-box core under a formal engine contract. Speed is engineered, not claimed.",
    visual: "flow",
  },
];

/* ------------------------------------------------------------------ */

export type build_status = "implemented" | "in-progress" | "planned";

export interface build_stage {
  id: string;
  label: string;
  detail: string;
  status: build_status;
  /** filled portion for the physical brick stack (0..1), not a % claim */
  fill: number;
}

/** §23 Development status — from PROJECT_STATE.md (2026-09-28). */
export const BUILD_STAGES: build_stage[] = [
  {
    id: "governance",
    label: "Foundation",
    detail:
      "Governance, CI, tooling, GPL v3 licensing, six-package Dart workspace.",
    status: "implemented",
    fill: 1,
  },
  {
    id: "domain",
    label: "Core domain",
    detail:
      "Result types, protocol domain model, engine contract, formal connection state machine, mock engine reference.",
    status: "implemented",
    fill: 1,
  },
  {
    id: "parser",
    label: "Configuration engine",
    detail:
      "Pure-Dart parsing of 8 protocol families, subscriptions, smart content router, Sing-Box serializer + inverse reader. Hardened by an adversarial pass that found and fixed two real bugs.",
    status: "implemented",
    fill: 1,
  },
  {
    id: "engine",
    label: "Android VPN engine",
    detail:
      "Native Kotlin harness proven with real APK builds. VpnService lifecycle and the libbox bridge are the current work.",
    status: "in-progress",
    fill: 0.45,
  },
  {
    id: "features",
    label: "App & features",
    detail:
      "State management, server management, traffic stats, auto-reconnect, kill switch.",
    status: "planned",
    fill: 0.12,
  },
  {
    id: "release",
    label: "Release",
    detail:
      "Security hardening, QA, signing, the first public Android release.",
    status: "planned",
    fill: 0.05,
  },
];

/* ------------------------------------------------------------------ */

export interface arch_layer {
  id: string;
  name: string;
  kind: "app" | "package" | "native" | "core";
  body: string;
  status: build_status;
}

/** §26 How Brick works — spatial architecture stack. */
export const ARCHITECTURE_LAYERS: arch_layer[] = [
  {
    id: "ui",
    name: "Brick UI",
    kind: "app",
    body: "Flutter, feature-first. Riverpod state, go_router navigation.",
    status: "in-progress",
  },
  {
    id: "domain",
    name: "Core domain",
    kind: "package",
    body: "Pure Dart. Protocol types and the VPN engine contract — the app never knows which platform it is on.",
    status: "implemented",
  },
  {
    id: "parser",
    name: "Configuration engine",
    kind: "package",
    body: "Pure Dart, adversarially tested. Links, subscriptions and raw config become a validated Sing-Box configuration.",
    status: "implemented",
  },
  {
    id: "engine-abstraction",
    name: "VPN engine abstraction",
    kind: "package",
    body: "A formal connection state machine with a stop watchdog. Illegal transitions are refused, never silently coerced.",
    status: "implemented",
  },
  {
    id: "native",
    name: "Native engine",
    kind: "native",
    body: "Kotlin VpnService with a typed bridge to the native core — the OS-mandated way to own a tunnel.",
    status: "in-progress",
  },
  {
    id: "network",
    name: "Network",
    kind: "core",
    body: "sing-box integrated as a native library. Brick integrates the proven core; it does not reimplement protocols.",
    status: "in-progress",
  },
];

/** §27 Connection lifecycle (ARCHITECTURE.md §3.1.1, normative graph). */
export interface lifecycle_state {
  id: string;
  label: string;
  description: string;
}

export const LIFECYCLE_STATES: lifecycle_state[] = [
  { id: "disconnected", label: "Disconnected", description: "Nothing has been attempted." },
  { id: "connecting", label: "Connecting", description: "Attempt accepted; tunnel forming." },
  { id: "connected", label: "Connected", description: "Tunnel up; traffic may flow." },
  { id: "disconnecting", label: "Disconnecting", description: "Teardown begins; watchdog guarantees convergence." },
  { id: "error", label: "Error", description: "Failure surfaced honestly — never masked as a clean stop." },
];

/* ------------------------------------------------------------------ */

export interface protocol_module {
  id: string;
  name: string;
  family: "TCP-based" | "QUIC-based" | "Standalone";
  note: string;
  status: build_status;
}

/**
 * §28 Protocol modules. All six are parsed by the delivered config parser
 * (PROJECT_STATE.md §1) — parser-level implemented; runtime support arrives
 * with the engine. Presented honestly as such.
 */
export const PROTOCOL_MODULES: protocol_module[] = [
  {
    id: "vless",
    name: "VLESS",
    family: "TCP-based",
    note: "Lightweight V2Ray protocol with TLS/REALITY transport options.",
    status: "implemented",
  },
  {
    id: "vmess",
    name: "VMess",
    family: "TCP-based",
    note: "Encrypted V2Ray protocol with header obfuscation.",
    status: "implemented",
  },
  {
    id: "trojan",
    name: "Trojan",
    family: "TCP-based",
    note: "TLS-camouflaged protocol that looks like ordinary web traffic.",
    status: "implemented",
  },
  {
    id: "shadowsocks",
    name: "Shadowsocks",
    family: "Standalone",
    note: "The classic lightweight proxy, cipher-validated against sing-box's list.",
    status: "implemented",
  },
  {
    id: "hysteria2",
    name: "Hysteria2",
    family: "QUIC-based",
    note: "QUIC-based protocol built for speed on lossy connections.",
    status: "implemented",
  },
  {
    id: "tuic",
    name: "TUIC",
    family: "QUIC-based",
    note: "QUIC-based protocol with low handshake overhead.",
    status: "implemented",
  },
];

/* ------------------------------------------------------------------ */

export interface security_principle {
  id: string;
  title: string;
  body: string;
  status: build_status;
}

/** §30 Security philosophy (SECURITY.md, config_parser SECURITY_NOTES.md). */
export const SECURITY_PRINCIPLES: security_principle[] = [
  {
    id: "defensive-parsing",
    title: "All input is hostile",
    body: "Configs, subscription URLs and QR codes are untrusted. Parsing is bounded and defensive.",
    status: "implemented",
  },
  {
    id: "secret-safe",
    title: "Secrets stay secret",
    body: "Error messages are tested with canary sweeps so no parser error echoes a credential.",
    status: "implemented",
  },
  {
    id: "state-machine",
    title: "Honest lifecycle",
    body: "A normative state graph refuses illegal transitions; failures are surfaced, not masked.",
    status: "implemented",
  },
  {
    id: "adversarial",
    title: "Adversarial testing",
    body: "A 104-test fuzz pass over 5,000 seeded hostile inputs found and fixed two real crash bugs.",
    status: "implemented",
  },
  {
    id: "no-telemetry",
    title: "No telemetry",
    body: "No remote telemetry service exists in the project. Release builds silence logging entirely.",
    status: "implemented",
  },
  {
    id: "hardening",
    title: "Deferred, not denied",
    body: "Encrypted storage and log redaction are documented as deferred work — published limitations, not hidden ones.",
    status: "in-progress",
  },
];

/* ------------------------------------------------------------------ */

export interface roadmap_item {
  id: string;
  when: "Now" | "Next" | "Later";
  title: string;
  body: string;
}

export const ROADMAP_ITEMS: roadmap_item[] = [
  {
    id: "now",
    when: "Now",
    title: "Android VPN engine",
    body: "Native harness proven with real APK builds; VpnService and the libbox bridge are in progress.",
  },
  {
    id: "next",
    when: "Next",
    title: "App features & hardening",
    body: "Server management, connect/disconnect, traffic stats, auto-reconnect, kill switch, encrypted storage, log redaction.",
  },
  {
    id: "later",
    when: "Later",
    title: "Release & beyond",
    body: "The first signed public Android release; desktop on a daemon architecture; iOS possible later.",
  },
];
