import { GlassLensProvider } from "@/components/ui/glass_lens_provider";
import { GlassPointer } from "@/components/ui/glass_pointer";
import { SiteShell } from "@/components/sections/site_shell";

export default function Home() {
  return (
    <>
      <GlassLensProvider />
      <GlassPointer />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteShell />
    </>
  );
}
