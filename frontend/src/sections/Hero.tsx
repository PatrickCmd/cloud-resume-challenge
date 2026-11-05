import avatar from "@/assets/avatar.jpg";
import { ArrowRight, Bot, FileText, Github, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profile, socialLinks } from "@/content/profile";

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
} as const;

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-heading" className="pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="flex flex-col-reverse md:flex-row md:items-center gap-10 md:gap-16">
        <div className="flex-1 space-y-6">
          {profile.availability && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {profile.availability}
            </span>
          )}

          <div className="space-y-2">
            <h1 id="hero-heading" className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {profile.name}
            </h1>
            <p className="text-xl md:text-2xl font-medium text-muted-foreground">{profile.title}</p>
          </div>

          <p className="max-w-[60ch] text-lg leading-relaxed text-foreground">{profile.headline}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href="#projects">
                View projects
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a href={profile.aiTwinUrl} target="_blank" rel="noopener noreferrer">
                <Bot className="h-4 w-4" aria-hidden="true" />
                Ask my AI twin
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost" className="gap-2">
              <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Resume
              </a>
            </Button>
          </div>

          <ul className="flex items-center gap-4" aria-label="Profiles">
            {socialLinks.map((link) => {
              const Icon = socialIcons[link.icon as keyof typeof socialIcons] ?? Github;
              return (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} profile`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 self-start md:self-center">
          <img
            src={avatar}
            alt={`Portrait of ${profile.name}`}
            width={224}
            height={224}
            fetchPriority="high"
            className="h-40 w-40 md:h-56 md:w-56 rounded-full border-4 border-border object-cover shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
