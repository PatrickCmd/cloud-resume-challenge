import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { experience, formatPeriod, isOlderThan, type ExperienceEntry } from "@/content/experience";
import { useIsMobile } from "@/hooks/use-mobile";

const COLLAPSE_AFTER_YEARS = 5;

function TimelineItem({ entry }: { entry: ExperienceEntry }) {
  return (
    <li className="relative pl-8 pb-10 last:pb-0">
      <span
        className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background"
        aria-hidden="true"
      >
        {!entry.end && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </span>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {entry.role}
          <span className="font-normal text-muted-foreground"> · </span>
          {entry.companyUrl ? (
            <a
              href={entry.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {entry.company}
            </a>
          ) : (
            <span className="font-medium">{entry.company}</span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground font-mono">
          <time dateTime={entry.start}>{formatPeriod(entry)}</time>
        </p>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{entry.location}</p>
      <ul className="mt-3 max-w-[72ch] space-y-2 text-sm leading-relaxed text-foreground">
        {entry.outcomes.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Technologies">
        {entry.tech.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {tag}
          </li>
        ))}
      </ul>
    </li>
  );
}

const MOBILE_INITIAL = 3;

export function Experience() {
  const [showEarlier, setShowEarlier] = useState(false);
  const earlierId = useId();
  const isMobile = useIsMobile();
  const recentAll = experience.filter((e) => !isOlderThan(e, COLLAPSE_AFTER_YEARS));
  const earlierAll = experience.filter((e) => isOlderThan(e, COLLAPSE_AFTER_YEARS));
  // Phones show the three latest roles first; everything else sits behind the toggle.
  const recent = isMobile ? recentAll.slice(0, MOBILE_INITIAL) : recentAll;
  const earlier = isMobile ? [...recentAll.slice(MOBILE_INITIAL), ...earlierAll] : earlierAll;

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="scroll-mt-24 py-16 md:py-24 border-t border-border"
    >
      <SectionHeading
        id="experience-heading"
        eyebrow="Experience"
        title="Where I have worked"
        description="Backend and AI roles across startups, consultancies and remote teams since 2017."
      />
      <ol id={earlierId} className="relative border-l-2 border-border ml-2 pl-0 list-none">
        {recent.map((entry) => (
          <TimelineItem key={`${entry.company}-${entry.start}`} entry={entry} />
        ))}
        {showEarlier &&
          earlier.map((entry) => <TimelineItem key={`${entry.company}-${entry.start}`} entry={entry} />)}
      </ol>
      {earlier.length > 0 && (
        <div className="mt-8 ml-2 pl-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEarlier((v) => !v)}
            aria-expanded={showEarlier}
            aria-controls={earlierId}
            className="gap-2"
          >
            {showEarlier ? "Show fewer roles" : `Show ${earlier.length} earlier roles`}
            <ChevronDown
              className={`h-4 w-4 transition-transform motion-reduce:transition-none ${showEarlier ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      )}
    </section>
  );
}
