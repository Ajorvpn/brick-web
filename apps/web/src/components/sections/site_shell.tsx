"use client";

import { FloatingNav } from "./floating_nav";
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
 * SiteShell — the full long-form experience. The pinned BrickStory owns the
 * hero and its scroll narrative; content sections follow immediately with
 * no artificial gap.
 */
export function SiteShell() {
  return (
    <>
      <FloatingNav />
      <main id="main">
        <BrickStory />
        <WhatIsBrick />
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
