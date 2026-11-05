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
              {/* Chips on phones keep the section short; a list reads better with room. */}
              <ul className="mt-4 flex flex-wrap gap-1.5 text-sm text-muted-foreground sm:block sm:space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs sm:flex sm:gap-2 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm"
                  >
                    <span className="mt-[0.55em] hidden h-1.5 w-1.5 shrink-0 rounded-full bg-border sm:block" aria-hidden="true" />
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
