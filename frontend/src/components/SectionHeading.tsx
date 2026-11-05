interface SectionHeadingProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
}

/** Consistent h2 + optional lead for every landing-page section. */
export function SectionHeading({ id, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-8 max-w-[72ch]">
      {eyebrow && (
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
      )}
      <h2 id={id} className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
