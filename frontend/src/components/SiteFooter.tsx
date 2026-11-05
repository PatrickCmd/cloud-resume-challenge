import { MapPin } from "lucide-react";
import { VisitorCounter } from "@/components/VisitorCounter";
import { profile } from "@/content/profile";

const builtWith: { label: string; url: string }[] = [
  { label: "React", url: "https://react.dev" },
  { label: "Vite", url: "https://vitejs.dev" },
  { label: "Tailwind", url: "https://tailwindcss.com" },
  { label: "FastAPI", url: "https://fastapi.tiangolo.com" },
  { label: "AWS", url: "https://aws.amazon.com" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {profile.location}
          </p>
          <p>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
        </div>
        <div className="space-y-1 md:text-right">
          <p>
            Built with{" "}
            {builtWith.map((item, index) => (
              <span key={item.label}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  {item.label}
                </a>
                {index < builtWith.length - 1 ? ", " : ""}
              </span>
            ))}
            . Source on{" "}
            <a
              href="https://github.com/PatrickCmd/cloud-resume-challenge"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              GitHub
            </a>
            .
          </p>
          <div className="md:flex md:justify-end">
            <VisitorCounter />
          </div>
        </div>
      </div>
    </footer>
  );
}
