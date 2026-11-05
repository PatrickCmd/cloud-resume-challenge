import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { certifications, featuredCertifications, type Certification } from "@/content/certifications";

function Badge({ cert }: { cert: Certification }) {
  const body = (
    <>
      {cert.badge && (
        <img src={cert.badge} alt="" width={112} height={112} loading="lazy" decoding="async" className="h-16 w-16 sm:h-28 sm:w-28" />
      )}
      <span className="text-xs font-medium leading-snug text-foreground sm:text-sm">{cert.name}</span>
      <span className="text-xs text-muted-foreground">
        {cert.issuer} · {cert.year}
      </span>
    </>
  );
  const className =
    "flex h-full w-full flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center transition-colors sm:p-5";
  return cert.credentialUrl ? (
    <a
      href={cert.credentialUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      {body}
      <span className="sr-only"> (verify credential, opens in a new tab)</span>
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Certifications() {
  const featuredIds = new Set(featuredCertifications.map((c) => c.id));
  const others = certifications.filter((c) => !featuredIds.has(c.id));
  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="scroll-mt-24 py-16 md:py-24 border-t border-border"
    >
      <SectionHeading
        id="certifications-heading"
        eyebrow="Certifications"
        title="Credentials"
        description="Each badge links to the verifiable record."
      />
      <ul className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-5" aria-label="Certifications">
        {featuredCertifications.map((cert) => (
          <li key={cert.id}>
            <Badge cert={cert} />
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <details className="group mt-8 max-w-[80ch] sm:[&>summary]:pointer-events-none" open={typeof window !== "undefined" && window.innerWidth >= 640}>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground [&::-webkit-details-marker]:hidden">
            <span>Courses and bootcamps</span>
            <span className="text-xs font-normal normal-case tracking-normal sm:hidden">({others.length}, tap to expand)</span>
          </summary>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {others.map((cert) => (
              <li key={cert.id} className="text-sm text-muted-foreground">
                {cert.credentialUrl ? (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 text-foreground underline-offset-4 hover:underline"
                  >
                    <span>{cert.name}</span>
                    <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="text-foreground">{cert.name}</span>
                )}
                <span className="block text-xs">
                  {cert.issuer} · {cert.year}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
