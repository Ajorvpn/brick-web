/**
 * Documentation content — static, local, sourced from the Brick repository.
 * Docs pages render this registry; no CMS, no backend.
 */

export type doc_block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "code"; lang: string; code: string }
  | { kind: "callout"; tone: "info" | "warn"; text: string }
  | {
      kind: "status_table";
      rows: {
        label: string;
        status: "implemented" | "in-progress" | "planned";
        note: string;
      }[];
    };

export interface doc_page {
  slug: string;
  title: string;
  description: string;
  /** repo doc this page summarizes */
  source: string;
  blocks: doc_block[];
}

export const DOC_PAGES: doc_page[] = [
  {
    slug: "introduction",
    title: "Introduction",
    description:
      "What Brick is, what it is not, and the state of the project.",
    source: "README.md · AI_ROLES/PROJECT_STATE.md",
    blocks: [
      {
        kind: "p",
        text: "Brick is a free, open-source, privacy-focused VPN client for Android, built as a Flutter/Dart monorepo with a native engine core. It is under active development — this page describes the verified project state, not aspirations.",
      },
      { kind: "h", text: "The short version" },
      {
        kind: "list",
        items: [
          "Governance, CI, tooling and the six-package Dart workspace are complete (Phase 0–1).",
          "The configuration engine parses 8 protocol families and compiles them to Sing-Box JSON (Phase 2).",
          "A native Kotlin Android harness builds a real APK; the VPN service bridge is the current work (Phase 3).",
          "There is no public release yet. Nothing on this site claims otherwise.",
        ],
      },
      { kind: "h", text: "Design principles" },
      {
        kind: "list",
        items: [
          "Privacy and protection of user data come first — no telemetry or analytics by default.",
          "Security decisions are written down and testable, not asserted in marketing.",
          "The VPN core is integrated (sing-box via libbox), not reimplemented.",
          "Every limitation is documented in the open.",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        text: "Source of truth: the repository's AI_ROLES/PROJECT_STATE.md — if this site and that file disagree, that file wins.",
      },
    ],
  },
  {
    slug: "architecture",
    title: "Architecture",
    description:
      "The layered architecture from Flutter UI to the native tunnel.",
    source: "AI_ROLES/ARCHITECTURE.md",
    blocks: [
      {
        kind: "p",
        text: "Brick is a six-package Dart workspace plus native platform modules. Pure-Dart packages carry no Flutter imports and are tested with plain dart test.",
      },
      { kind: "h", text: "Layers" },
      {
        kind: "status_table",
        rows: [
          { label: "Flutter app (features, Riverpod, go_router)", status: "in-progress", note: "skeleton + wiring delivered" },
          { label: "core_domain — protocol types, engine contract", status: "implemented", note: "sealed types, 123 tests" },
          { label: "config_parser — links/subscriptions → Sing-Box JSON", status: "implemented", note: "370 tests incl. adversarial pass" },
          { label: "core_vpn_engine — VpnEngine contract + state machine", status: "implemented", note: "43 tests, mock reference engine" },
          { label: "native/android — Kotlin harness", status: "in-progress", note: "APK build proven; VpnService next" },
          { label: "sing-box core via libbox", status: "in-progress", note: "pinned to v1.10.7 toolchain" },
        ],
      },
      { kind: "h", text: "The engine contract" },
      {
        kind: "p",
        text: "The app never knows which platform it runs on. It talks to an abstract VpnEngine interface: connection state and traffic stats are separate streams with independent failure domains, and lifecycle is a formal state machine.",
      },
      { kind: "h", text: "Connection lifecycle" },
      {
        kind: "code",
        lang: "text",
        code: "Disconnected → Connecting → Connected → Disconnecting → Disconnected\n      ↘ Error ↗ (honest failure branch, always surfaced)",
      },
      {
        kind: "callout",
        tone: "warn",
        text: "Illegal transitions are programmer errors: they must be refused, never silently coerced. This rule exists because a previous prototype showed “connected” over a dead tunnel.",
      },
    ],
  },
  {
    slug: "security",
    title: "Security",
    description:
      "Threat model, data classification and the adversarial testing posture.",
    source: "AI_ROLES/SECURITY.md · config_parser/SECURITY_NOTES.md",
    blocks: [
      {
        kind: "p",
        text: "Brick may be used in high-risk environments, so security rules are load-bearing, not guidance. The repository maintains a written threat model covering network-level censors, device seizure, malicious config providers, supply-chain attacks and release tampering.",
      },
      { kind: "h", text: "Data classification" },
      {
        kind: "list",
        items: [
          "Server configuration — high sensitivity. Encrypted at rest, never logged.",
          "Traffic statistics — low sensitivity, in-memory only.",
          "Diagnostic logs — high sensitivity by default; redaction required before any output.",
        ],
      },
      { kind: "h", text: "Adversarial parsing" },
      {
        kind: "p",
        text: "All imported configuration is untrusted input. The parser is bounded and defensive: size caps, redirect caps, HTTPS-only subscription fetching, and a 104-test fuzz pass over 5,000 seeded hostile inputs. That pass found and fixed two real crash bugs reachable from a single pasted link.",
      },
      { kind: "h", text: "Verified safeguards" },
      {
        kind: "status_table",
        rows: [
          { label: "Secret-safe error messages (canary-swept)", status: "implemented", note: "error_redaction_test.dart" },
          { label: "No toString() on config/domain types", status: "implemented", note: "no accidental secret dumps" },
          { label: "State-machine enforcement with stop watchdog", status: "implemented", note: "core_vpn_engine" },
          { label: "Encrypted local storage", status: "planned", note: "Phase 8" },
          { label: "Runtime log redaction", status: "planned", note: "Phase 8 — stub today, documented" },
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        text: "Deferred work is published, not hidden: redaction is a documented no-op stub until Phase 8. Do not assume it is solved.",
      },
    ],
  },
  {
    slug: "protocols",
    title: "Protocols",
    description:
      "The six protocol families and what parser-level support means.",
    source: "packages/config_parser/README.md · PROJECT_STATE.md",
    blocks: [
      {
        kind: "p",
        text: "The configuration engine parses six protocol families from URIs, subscription payloads, raw JSON and deep links, then serializes them to Sing-Box 1.10+ JSON. An inverse reader validates round-trips.",
      },
      { kind: "h", text: "Families" },
      {
        kind: "status_table",
        rows: [
          { label: "VLESS", status: "implemented", note: "TCP-based, TLS/REALITY transports" },
          { label: "VMess", status: "implemented", note: "TCP-based" },
          { label: "Trojan", status: "implemented", note: "TCP-based" },
          { label: "Shadowsocks", status: "implemented", note: "SIP002 + legacy, cipher-validated" },
          { label: "Hysteria2", status: "implemented", note: "QUIC-based" },
          { label: "TUIC", status: "implemented", note: "QUIC-based" },
          { label: "WireGuard / AmneziaWG", status: "implemented", note: "parsed; AWG runtime limited by sing-box schema" },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        text: "Parser-level support means: a pasted link becomes a validated runtime model. Actual tunneling arrives with the native engine — the distinction is kept visible everywhere on this site.",
      },
      { kind: "h", text: "Known limits" },
      {
        kind: "list",
        items: [
          "The sing-box WireGuard outbound is deprecated upstream; an endpoint migration is planned.",
          "AmneziaWG obfuscation parameters cannot be serialized for runtime use today.",
          "brick:// deep links are parsed but not yet registered as an Android intent filter.",
        ],
      },
    ],
  },
  {
    slug: "development",
    title: "Development status",
    description:
      "What exists right now, verified from the project state file.",
    source: "AI_ROLES/PROJECT_STATE.md (2026-09-28)",
    blocks: [
      {
        kind: "p",
        text: "Current phase: Phase 3 — Android VPN Engine, Gate A (native harness). The harness is a standalone, CLI-buildable Gradle project; ./gradlew assembleDebug produces a real 3.2 MB debug APK. The APK has never been installed on a device yet — no emulator was available in the build environment.",
      },
      { kind: "h", text: "Verified measurements" },
      {
        kind: "list",
        items: [
          "575 tests pass monorepo-wide (551 pure-Dart + 24 Flutter), re-run 2026-09-28.",
          "flutter analyze: 0 errors, 0 warnings, 0 lints across all 6 packages.",
          "Pure-Dart isolation verified: no Flutter imports in core packages.",
          "Pinned toolchain: Flutter 3.47.4, Dart 3.13.3, sing-box v1.10.7, NDK r26b, compileSdk 36.",
        ],
      },
      { kind: "h", text: "What does not exist yet" },
      {
        kind: "list",
        items: [
          "Real redaction logic (Phase 8) — the hook exists, the masking rules do not.",
          "VpnService + libbox JNI bridge (the heart of Phase 3).",
          "Any public release, device-run acceptance, or iOS/desktop support.",
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        text: "CI on master was red on the formatting job at last record; a verified local fix awaits a human push. Governance requires humans to execute all git writes.",
      },
    ],
  },
  {
    slug: "roadmap",
    title: "Roadmap notes",
    description:
      "The phase plan from the repository, summarized honestly.",
    source: "AI_ROLES/ROADMAP.md",
    blocks: [
      {
        kind: "p",
        text: "The repository roadmap defines 15 phases. The website's Now/Next/Later summary maps onto them:",
      },
      { kind: "h", text: "Now" },
      {
        kind: "p",
        text: "Phase 3 — Android VPN engine: VpnService lifecycle, the libbox bridge, and closing out Phase 2's remaining human-verification gates.",
      },
      { kind: "h", text: "Next" },
      {
        kind: "p",
        text: "Phases 4–8: state management, core MVP features (server management, connect/disconnect, QR import), traffic stats and live logs, lifecycle hardening (auto-reconnect, kill switch), and security hardening (encrypted storage, real log redaction).",
      },
      { kind: "h", text: "Later" },
      {
        kind: "p",
        text: "Phases 9–12: consolidated QA, the first signed public Android release, full UI/UX design pass, then desktop support on a daemon architecture. iOS is possible later; a premium tier is architecturally decoupled and not a current focus.",
      },
      {
        kind: "callout",
        tone: "info",
        text: "No dates, no percentages. The roadmap is a sequence of gates, and each gate has a definition of done.",
      },
    ],
  },
  {
    slug: "contributing",
    title: "Contributing",
    description:
      "How development works and how to get involved.",
    source: "AI_ROLES/AGENTS.md · README.md",
    blocks: [
      {
        kind: "p",
        text: "Brick is developed AI-assisted with strict human governance: coding agents may edit files, but a human executes every git write. Quality gates run on every change.",
      },
      { kind: "h", text: "Working on the project" },
      {
        kind: "code",
        lang: "bash",
        code: "melos bootstrap\nmelos run format --no-select\nmelos run analyze --no-select\nmelos run test --no-select",
      },
      { kind: "h", text: "Ground rules" },
      {
        kind: "list",
        items: [
          "Read AI_ROLES/PROJECT_STATE.md before any task — it is the authoritative state.",
          "Pure-Dart packages must stay free of Flutter imports.",
          "Security-relevant changes must comply with AI_ROLES/SECURITY.md.",
          "Documentation of limitations is part of the work, not an afterthought.",
        ],
      },
      { kind: "h", text: "Reporting issues" },
      {
        kind: "p",
        text: "Bugs, documentation problems and development questions go through the GitHub issue tracker. Never include server credentials, subscription URLs, tokens or other sensitive connection data in an issue.",
      },
    ],
  },
];

export function get_doc_page(slug: string): doc_page | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}

export const DOC_SLUGS = DOC_PAGES.map((p) => p.slug);
