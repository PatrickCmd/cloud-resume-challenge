import { Bot, Github, Linkedin, Mail, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import { profile } from "@/content/profile";

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-24 py-16 md:py-24 border-t border-border">
      <SectionHeading
        id="contact-heading"
        eyebrow="Contact"
        title="Let's talk"
        description={`Email is the fastest way to reach me. I am in ${profile.location} (${profile.timezone}) and reply within a day.`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className="gap-2">
          <a href={`mailto:${profile.email}`}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email me
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-4 w-4" aria-hidden="true" />
            LinkedIn
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer">
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
        </Button>
        {profile.links.x && (
          <Button asChild size="lg" variant="outline" className="gap-2">
            <a href={profile.links.x} target="_blank" rel="noopener noreferrer">
              <Twitter className="h-4 w-4" aria-hidden="true" />
              X
            </a>
          </Button>
        )}
      </div>

      <div className="mt-10 flex max-w-[72ch] flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Prefer to ask questions first?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            My AI twin answers questions about my experience, stack and availability, grounded in what I have written.
          </p>
        </div>
        <Button asChild variant="secondary" className="gap-2 shrink-0">
          <a href={profile.aiTwinUrl} target="_blank" rel="noopener noreferrer">
            <Bot className="h-4 w-4" aria-hidden="true" />
            Ask my AI twin
          </a>
        </Button>
      </div>
    </section>
  );
}
