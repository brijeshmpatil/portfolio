import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/ui/Footer";
import { Grain } from "@/components/ui/Grain";
import { Nav } from "@/components/ui/Nav";
import { SITE } from "@/lib/site";
import "./globals.css";

/* Self-hosted by next/font — no third-party request, so no render-blocking
   round trip to fonts.gstatic.com.
 *
 * `display: "optional"` rather than "swap", and this was measured. With "swap",
 * throttled to a slow-4G profile, the fonts landed ~1.3s in and the metric
 * change moved the hero text block 16px — a 0.093 CLS, which is most of the way
 * to failing the threshold and nowhere near the "under 0.01" this site claims.
 *
 * "optional" means the browser uses the metric-adjusted fallback unless the real
 * font is already there, so there is never a swap and never a shift. On any
 * reasonable connection the preloaded font arrives in time and you see the
 * intended type; on a bad one the first page view is set in the fallback and the
 * font is cached for the next. Given the argument this site is making, a
 * slightly plainer first paint is the right side of that trade.
 */
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-inter-tight",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-jetbrains",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "optional",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.role}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.role}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrains.variable} ${instrument.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[200] rounded bg-signal px-4 py-2 font-mono text-xs uppercase text-void"
        >
          Skip to content
        </a>

        <Grain />
        <Nav />

        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
