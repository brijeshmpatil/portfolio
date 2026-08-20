import { AboutTeaser } from "@/components/sections/AboutTeaser";
import { BrandMarquee } from "@/components/sections/BrandMarquee";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { Metrics } from "@/components/sections/Metrics";
import { SelectedWork } from "@/components/sections/SelectedWork";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandMarquee />
      <SelectedWork />
      <Metrics />
      <Capabilities />
      <AboutTeaser />
      <Contact />
    </>
  );
}
