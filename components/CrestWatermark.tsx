import { site } from "@/lib/site";

/**
 * A large, faded team crest fixed behind the page content. Renders nothing
 * until NEXT_PUBLIC_LOGO_URL is configured, so the site works fine without it.
 */
export function CrestWatermark({ opacity = 0.16 }: { opacity?: number }) {
  if (!site.logoUrl) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={site.logoUrl}
        alt=""
        style={{ opacity }}
        className="h-[92vmin] w-[92vmin] max-w-none select-none object-contain"
      />
    </div>
  );
}
