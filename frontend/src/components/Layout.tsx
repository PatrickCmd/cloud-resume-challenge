import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/** Scrolls to the hash target after route changes (e.g. /#projects from another page). */
function useHashScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    // Sections may render after lazy data; retry briefly.
    let attempts = 0;
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
      if (attempts++ < 10) setTimeout(tick, 50);
    };
    tick();
  }, [pathname, hash]);
}

function RouteFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground" role="status">
      Loading…
    </div>
  );
}

export function Layout() {
  useHashScroll();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
