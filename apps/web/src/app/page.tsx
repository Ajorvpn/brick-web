import { GlassLensProvider } from "@/components/ui/glass_lens_provider";
import { SiteShell } from "@/components/sections/site_shell";

export default function Home() {
  return (
    <>
      <GlassLensProvider />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteShell />
    </>
  );
}
