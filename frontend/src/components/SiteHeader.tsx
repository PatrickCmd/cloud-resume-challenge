import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

export const navItems = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "writing", label: "Writing" },
  { id: "contact", label: "Contact" },
] as const;

type SectionId = (typeof navItems)[number]["id"];

/** Tracks which landing-page section is in view so the matching nav link can be highlighted. */
function useActiveSection(enabled: boolean): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") {
      setActive(null);
      return;
    }
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }
        if (visible.size === 0) {
          if (window.scrollY < 200) setActive(null);
          return;
        }
        // Prefer the section whose top is closest to the header.
        const best = [...visible.keys()]
          .map((id) => ({ id, top: Math.abs(document.getElementById(id)!.getBoundingClientRect().top - 96) }))
          .sort((a, b) => a.top - b.top)[0];
        setActive(best.id as SectionId);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: [0, 0.1, 0.5] },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);

  return active;
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const active = useActiveSection(onHome);
  const [open, setOpen] = useState(false);

  const hrefFor = (id: SectionId) => (onHome ? `#${id}` : `/#${id}`);

  const linkClass = (id: SectionId) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
      "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active === id ? "text-foreground bg-secondary" : "text-muted-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${profile.name}, home`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground" aria-hidden="true">
            PW
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={hrefFor(item.id)}
                  className={linkClass(item.id)}
                  aria-current={active === item.id ? "location" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
              Resume
            </a>
          </Button>
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-base">Menu</SheetTitle>
              <nav aria-label="Mobile" className="mt-6">
                <ul className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={hrefFor(item.id)}
                        onClick={() => setOpen(false)}
                        className={cn(linkClass(item.id), "block text-base")}
                        aria-current={active === item.id ? "location" : undefined}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                  <li className="mt-4 border-t border-border pt-4">
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      Resume (PDF)
                    </a>
                  </li>
                  <li>
                    <a
                      href={profile.aiTwinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      Ask my AI twin
                    </a>
                  </li>
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
