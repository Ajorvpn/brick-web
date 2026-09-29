import { GlassSurface } from "@/components/ui/glass_surface";

/**
 * HeroFallback — static composition when WebGL is unavailable or the scene
 * has not mounted yet. Pure CSS brick, correct proportions, calm.
 */
export function HeroFallback() {
  return (
    <div
      aria-hidden
      data-hero-brick
      className="pointer-events-none absolute right-[6%] top-1/2 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative aspect-[2.15/1] w-[26rem] rotate-[-5deg]">
        <div className="absolute inset-0 rounded-[0.9rem] border border-white/12 bg-gradient-to-br from-[#8a4a30]/85 via-[#6e3421]/80 to-[#54271a]/85 shadow-[0_40px_90px_-20px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.14)]">
          {/* the brick face: subtle texture strips */}
          <div className="absolute inset-x-5 top-1/2 h-px -translate-y-1/2 bg-white/8" />
          <div className="absolute inset-x-5 top-[58%] h-px bg-white/6" />
          <div className="absolute bottom-4 left-6 h-1.5 w-24 rounded-full bg-white/6" />
          {/* inner light seam */}
          <div className="absolute -right-1 top-1/2 h-16 w-1.5 -translate-y-1/2 rounded-full bg-brick-300/70 blur-[2px]" />
        </div>
        {/* contact shadow */}
        <div className="absolute -bottom-8 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/50 blur-xl" />
      </div>
    </div>
  );
}

/** Mobile-positioned variant used below lg. */
export function HeroFallbackMobile() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[13rem] flex justify-center lg:hidden">
      <GlassSurface
        level={3}
        glow
        className="aspect-[2.15/1] w-60 rotate-[-4deg] rounded-xl"
      >
        <div className="absolute inset-x-4 top-1/2 h-[14%] -translate-y-1/2 rounded bg-brick-500/85" />
        <div className="absolute inset-x-4 top-[64%] h-px bg-white/25" />
      </GlassSurface>
    </div>
  );
}
