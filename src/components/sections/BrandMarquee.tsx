import { Marquee } from "@/components/motion/Marquee";
import { BRANDS } from "@/content/projects";

export function BrandMarquee() {
  return (
    <section
      className="hairline py-14"
      aria-labelledby="brands-heading"
    >
      <p id="brands-heading" className="gutter label">
        Shipped for
      </p>

      <div className="mt-8">
        <Marquee items={BRANDS} duration={44} />
      </div>
    </section>
  );
}
