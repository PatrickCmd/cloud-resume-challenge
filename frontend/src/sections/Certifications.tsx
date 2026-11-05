import { SectionHeading } from "@/components/SectionHeading";
import { certifications, featuredCertifications, type Certification } from "@/content/certifications";

function Badge({ cert }: { cert: Certification }) {
  const image = cert.badge ? (
    <img src={cert.badge} alt="" width={96} height={96} loading="lazy" className="h-24 w-24" />
  ) : null;
  const body = (
    <>
      {image}
      <span className="text-sm font-medium leading-snug text-foreground">{cert.name}</span>
      <span className="text-xs text-muted-foreground">
        {cert.issuer} · {cert.year}
      </span>
    </>
  );
  const className =
    "flex w-56 flex-col items-center gap-2 rounded-lg border border-border bg-card p-5 text-center transition-colors";
  return cert.credentialUrl ? (
    <a
      href={cert.credentialUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      {body}
      <span className="sr-only"> (verify on Credly, opens in a new tab)</span>
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Certifications() {
  const others = certifications.filter((c) => !c.featured);
  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="scroll-mt-24 py-16 md:py-24 border-t border-border"
    >
      <SectionHeading id="certifications-heading" eyebrow="Certifications" title="Credentials" />
      <ul className="flex flex-wrap gap-4" aria-label="AWS certifications">
        {featuredCertifications.map((cert) => (
          <li key={cert.id}>
            <Badge cert={cert} />
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <p className="mt-6 max-w-[72ch] text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Also: </span>
          {others.map((c) => `${c.name} (${c.issuer})`).join(" · ")}
        </p>
      )}
    </section>
  );
}
