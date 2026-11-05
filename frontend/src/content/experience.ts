/**
 * Work history, newest first. Dates are YYYY-MM; `end` is null for the current role.
 * `outcomes` should be 2 to 3 result-oriented bullets. `tech` renders as tags.
 */

export interface ExperienceEntry {
  company: string;
  companyUrl?: string;
  role: string;
  location: string;
  start: string;
  end: string | null;
  outcomes: string[];
  tech: string[];
}

export const experience: ExperienceEntry[] = [
  {
    company: "Sunbird AI",
    companyUrl: "https://sunbird.ai",
    role: "Software Engineer",
    location: "Kampala, Uganda",
    start: "2024-04",
    end: null,
    outcomes: [
      "Build and operate the production APIs behind Sunbird AI's language models: OpenAI-compatible LLM endpoints, speech (ASR/TTS) backends, and an MCP server, deployed on AWS and GCP Cloud Run.",
      "Run inference across GPU platforms (RunPod, Modal, Vast.ai, Hugging Face Inference Endpoints) with model versioning, warm-pool capacity planning, and cost and latency trade-offs.",
      "Automate infrastructure and delivery with Terraform, Docker, and GitHub Actions, and add authentication, rate limiting, and usage billing to public APIs.",
    ],
    tech: ["Python", "FastAPI", "AWS", "GCP Cloud Run", "Terraform", "Docker", "Hugging Face", "LLMs"],
  },
  {
    company: "Audersity",
    role: "Python/Django Backend Engineer",
    location: "Kampala, Uganda",
    start: "2023-05",
    end: "2024-06",
    outcomes: [
      "Designed and shipped backend features across Django-based systems with cross-functional product teams.",
      "Improved API reliability and performance through clean architecture, structured logging, and test coverage.",
    ],
    tech: ["Python", "Django", "PostgreSQL", "Docker", "CI/CD"],
  },
  {
    company: "Cecure Intelligence Limited",
    role: "Data Engineer Graduate Trainee",
    location: "Lagos, Nigeria (remote)",
    start: "2023-02",
    end: "2024-03",
    outcomes: [
      "Built ETL pipelines and automated data ingestion workflows feeding analytics and reporting.",
      "Supported engineering teams delivering data-driven applications.",
    ],
    tech: ["Python", "SQL", "Pandas", "ETL"],
  },
  {
    company: "HAMWE EA",
    role: "Python/Django Developer (contract, MTN Rwanda)",
    location: "Kampala, Uganda",
    start: "2021-06",
    end: "2022-06",
    outcomes: [
      "Developed and deployed the Django REST API powering cooperative and farmer onboarding for MTN Rwanda's agriculture digitization platform.",
      "Designed PostgreSQL schemas for the user, cooperative, collections, and shipment modules and built a USSD module for farmer collection and loan management.",
      "Ran CI/CD with GitHub Actions to DigitalOcean using Docker, Nginx, and Gunicorn; cleaned field data with Pandas for ingestion.",
    ],
    tech: ["Python", "Django", "PostgreSQL", "USSD", "Docker", "GitHub Actions", "Pandas"],
  },
  {
    company: "BoldGains",
    role: "Python/Django Engineer",
    location: "Dubai, UAE (remote)",
    start: "2021-09",
    end: "2022-01",
    outcomes: [
      "Built backend modules for the Blockbrite payment gateway, including the bank transaction integration layer.",
      "Wrote unit and integration tests for the user and M-Pesa transaction modules to improve reliability.",
    ],
    tech: ["Python", "Django", "PostgreSQL", "Payments"],
  },
  {
    company: "Andela",
    role: "Software Developer",
    location: "Kampala, Uganda",
    start: "2017-11",
    end: "2021-12",
    outcomes: [
      "Placed with distributed engineering teams at partner companies building scalable applications.",
      "Contributed to backend development, testing, and system debugging across several client engagements.",
    ],
    tech: ["Python", "Django", "Flask", "PostgreSQL", "JavaScript"],
  },
  {
    company: "NITA-U IT",
    role: "Python/Django Developer",
    location: "Kampala, Uganda",
    start: "2020-05",
    end: "2020-12",
    outcomes: [
      "Built and maintained RESTful APIs for the national IT certification extranet used by providers, institutions, and the certification office.",
      "Reworked invoice generation across provider types and integrated SMS notifications into the certification workflow.",
    ],
    tech: ["Python", "Django", "PostgreSQL", "REST APIs"],
  },
  {
    company: "Tarana Wireless, Inc.",
    role: "Software Engineer",
    location: "Santa Clara, CA (remote)",
    start: "2019-03",
    end: "2020-02",
    outcomes: [
      "Added features to the internal inventory application used to reserve hardware during testing.",
      "Automated laboratory test processes that validated device metrics before release to residential sites.",
    ],
    tech: ["Python", "Flask", "PostgreSQL", "Test automation"],
  },
  {
    company: "Chartmetric",
    role: "Junior Software Developer",
    location: "United States (remote)",
    start: "2018-10",
    end: "2019-01",
    outcomes: [
      "Scraped music analytics data from third-party APIs into PostgreSQL pipelines.",
      "Wrote SQL exports for client data requests and fixed backend bugs.",
    ],
    tech: ["Python", "PostgreSQL", "SQL", "Scrapy"],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatPeriod(entry: Pick<ExperienceEntry, "start" | "end">): string {
  return `${formatMonth(entry.start)} – ${entry.end ? formatMonth(entry.end) : "Present"}`;
}

/** True when the role ended more than `years` years before `now`. */
export function isOlderThan(entry: Pick<ExperienceEntry, "end">, years: number, now: Date = new Date()): boolean {
  if (!entry.end) return false;
  const [y, m] = entry.end.split("-").map(Number);
  const cutoff = new Date(now.getFullYear() - years, now.getMonth(), 1);
  return new Date(y, m - 1, 1) < cutoff;
}
