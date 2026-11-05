import { SectionHeading } from "@/components/SectionHeading";
import { profile, profileFacts } from "@/content/profile";

export function About() {
  const facts = profileFacts();
  return (
    <section id="about" aria-labelledby="about-heading" className="scroll-mt-24 py-16 md:py-24 border-t border-border">
      <SectionHeading id="about-heading" eyebrow="About" title="What I do" />
      <div className="grid gap-10 md:grid-cols-5">
        <p className="md:col-span-3 max-w-[72ch] text-base md:text-lg leading-relaxed text-foreground">
          {profile.about}
        </p>
        <dl className="md:col-span-2 grid gap-4 self-start rounded-lg border border-border bg-card p-6">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
              <dd className="mt-1 text-sm text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
