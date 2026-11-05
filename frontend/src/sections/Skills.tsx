import { Brain, Cloud, Database, Server } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { skillGroups, type SkillGroup } from "@/content/skills";

const icons: Record<SkillGroup["id"], typeof Server> = {
  backend: Server,
  data: Database,
  cloud: Cloud,
  ai: Brain,
};

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="scroll-mt-24 py-16 md:py-24 border-t border-border">
      <SectionHeading
        id="skills-heading"
        eyebrow="Skills"
        title="Tools I reach for"
        description="Grouped by where they sit in a system. Depth is in Python backends and AWS; the AI column is where most of my current work happens."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {skillGroups.map((group) => {
          const Icon = icons[group.id];
          return (
            <div key={group.id} className="rounded-lg border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
