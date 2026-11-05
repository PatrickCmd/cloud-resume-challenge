/**
 * Profile content: identity, positioning, links, and the short copy used by the
 * hero, about, contact, metadata and resume. Edit this file, not the components.
 */

export interface SocialLink {
  label: string;
  url: string;
  /** Icon key understood by the UI (lucide icon name). */
  icon: "github" | "linkedin" | "mail" | "twitter" | "bot" | "globe";
}

export interface EducationEntry {
  institution: string;
  degree: string;
  startYear: number;
  endYear: number;
}

export interface Profile {
  name: string;
  firstName: string;
  handle: string;
  /** Job title as shown next to the name and in metadata. */
  title: string;
  /** One-sentence positioning line for the hero. */
  headline: string;
  /** Single-sentence site description for metadata. */
  description: string;
  location: string;
  timezone: string;
  employer: { name: string; url: string };
  email: string;
  /** Month the professional career started, YYYY-MM. Used to compute years of experience. */
  careerStart: string;
  /** Text for the availability pill in the hero. Set to null to hide the pill. */
  availability: string | null;
  siteUrl: string;
  aiTwinUrl: string;
  /** Public path or absolute URL to the resume PDF. */
  resumeUrl: string;
  links: {
    github: string;
    linkedin: string;
    x: string | null;
  };
  /** One paragraph for the About section. */
  about: string;
  /** Longer summary used by the resume. */
  summary: string;
  education: EducationEntry[];
}

export const profile: Profile = {
  name: "Patrick Walukagga",
  firstName: "Patrick",
  handle: "PatrickCmd",
  title: "Software & AI Engineer",
  headline:
    "Backend and AI engineer who takes LLM systems from prototype to production on AWS.",
  description:
    "Patrick Walukagga is a Software and AI Engineer in Kampala building production LLM services, backend APIs, and cloud infrastructure on AWS.",
  location: "Kampala, Uganda",
  timezone: "East Africa Time (UTC+3)",
  employer: { name: "Sunbird AI", url: "https://sunbird.ai" },
  email: "p.walukagga@gmail.com",
  careerStart: "2017-11",
  availability: "Open to Backend / AI engineering roles",
  siteUrl: "https://patrickcmd.dev",
  aiTwinUrl: "https://digital-twin.patrickcmd.dev",
  resumeUrl: "/Patrick-Walukagga-Resume.pdf",
  links: {
    github: "https://github.com/PatrickCmd",
    linkedin: "https://www.linkedin.com/in/patrick-walukagga-53261382/",
    x: null,
  },
  about:
    "I build the backend side of AI products: APIs that wrap language and speech models, the inference infrastructure behind them, and the automation that keeps them reliable. At Sunbird AI I work on production LLM and speech services for African languages, deployed on AWS and GCP. Before that I spent six years shipping Python backends for fintech, agriculture, and enterprise systems, which is where my habits around testing, observability, and clean API design come from.",
  summary:
    "Backend software engineer with 8+ years of experience designing and operating scalable backend systems, cloud-native services, and ML-enabled products. Current emphasis on AI and LLM engineering and production inference: dependable APIs, latency and cost trade-offs, observability, and disciplined release practices around models and artifacts. Primary stack is Python, Django, FastAPI, PostgreSQL, Docker, and AWS, with infrastructure as code (Terraform, CloudFormation, Ansible) and GPU inference platforms (RunPod, Modal, Vast.ai, Hugging Face).",
  education: [
    {
      institution: "Nkumba University",
      degree: "Bachelor's Degree in Information Technology",
      startYear: 2012,
      endYear: 2015,
    },
  ],
};

/** Whole years since `careerStart`, floored. */
export function yearsOfExperience(now: Date = new Date()): number {
  const [year, month] = profile.careerStart.split("-").map(Number);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return Math.max(0, Math.floor(months / 12));
}

/** Short facts rendered next to the About paragraph. */
export function profileFacts(now: Date = new Date()): { label: string; value: string }[] {
  return [
    { label: "Currently", value: `Software Engineer at ${profile.employer.name}` },
    { label: "Experience", value: `${yearsOfExperience(now)}+ years in backend and cloud` },
    { label: "Certified", value: "AWS Solutions Architect Associate, AWS Cloud Practitioner, Kubernetes (LFS250)" },
    { label: "Based in", value: `${profile.location} (${profile.timezone})` },
  ];
}

export const socialLinks: SocialLink[] = [
  { label: "GitHub", url: profile.links.github, icon: "github" },
  { label: "LinkedIn", url: profile.links.linkedin, icon: "linkedin" },
  ...(profile.links.x ? [{ label: "X", url: profile.links.x, icon: "twitter" as const }] : []),
];
