"use client";

import { FloatingNav } from "./floating_nav";
import { SmoothScroll } from "./smooth_scroll";
import { BrickStory } from "./brick_story";
import { WhatIsBrick } from "./what_is_brick";
import { WhyBrick } from "./why_brick";
import { DevelopmentStatus } from "./development_status";
import { HowItWorks } from "./how_it_works";
import { Protocols } from "./protocols";
import { Security } from "./security";
import { OpenSource } from "./open_source";
import { Roadmap } from "./roadmap";
import { FinalCta } from "./final_cta";
import { SiteFooter } from "./site_footer";

/**
 * SiteShell — the full long-form experience.
 *
 * BrickStory owns the hero, its scroll narrative and the fixed canvas that
 * stays behind the page afterwards. The first content section is wrapped in
 * `[data-brick-sheet]`: during the recession it rises like an iOS sheet over
 * the receding wall, and afterwards it scrolls away as ordinary content with
 * the wall still faintly moving behind it.
 */
export function SiteShell() {
  return (
    <>
      <FloatingNav />
      <SmoothScroll />
      <main id="main">
        <BrickStory />
        <div
          data-brick-sheet
          className="relative z-20 rounded-t-[2rem] border-t border-white/[0.07] bg-[linear-gradient(180deg,rgb(9_9_12/0.86)_0%,rgb(7_7_10/0.93)_58%,rgb(5_5_7/0)_100%)] shadow-[0_-40px_100px_-30px_rgb(0_0_0/0.9)] will-change-transform"
        >
          <WhatIsBrick />
        </div>
        <WhyBrick />
        <DevelopmentStatus />
        <HowItWorks />
        <Protocols />
        <Security />
        <OpenSource />
        <Roadmap />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
