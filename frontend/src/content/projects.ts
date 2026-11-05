/**
 * Featured projects for the home page grid and the /projects/:slug case studies.
 * Order is display order. Keep `featured` entries to six or fewer.
 * Case-study markdown lives in ./case-studies/<slug>.md with H2 sections
 * Context, Architecture, Decisions, Results.
 */

export interface Project {
  slug: string;
  title: string;
  /** One line: the problem this solved. */
  problem: string;
  /** One line: the result. */
  outcome: string;
  tags: string[];
  /** Public path to a 16:9 cover image. */
  image: string;
  imageAlt: string;
  links: {
    github?: string;
    live?: string;
  };
  /** When true a case study page exists at /projects/<slug>. */
  caseStudy: boolean;
  featured: boolean;
  year: number;
}

export const projects: Project[] = [
  {
    slug: "digital-twin",
    title: "Digital Twin",
    problem:
      "Recruiters ask the same questions about my background; I wanted an AI that answers them in my voice without inventing anything.",
    outcome:
      "Live AI twin on AWS Bedrock with a grounded prompt, a 10-question regression eval, rate limiting, feedback capture, and Terraform deploys via GitHub OIDC.",
    tags: ["FastAPI", "AWS Bedrock", "Lambda", "Next.js", "Terraform", "CloudFront"],
    image: "/projects/digital-twin.svg",
    imageAlt: "Digital Twin chat interface illustration",
    links: {
      github: "https://github.com/PatrickCmd/digital-twin",
      live: "https://digital-twin.patrickcmd.dev",
    },
    caseStudy: true,
    featured: true,
    year: 2026,
  },
  {
    slug: "mlops-pipeline",
    title: "End-to-End MLOps Pipeline",
    problem:
      "Turn a bike-share trip-duration model into a repeatable pipeline instead of a notebook.",
    outcome:
      "Training, MLflow experiment tracking with S3 artifacts, model registry staging, scheduled Prefect deployments, and a containerised prediction web service.",
    tags: ["MLflow", "Prefect", "scikit-learn", "AWS S3", "Flask", "Docker"],
    image: "/projects/mlops-pipeline.svg",
    imageAlt: "MLOps pipeline stages illustration",
    links: {
      github: "https://github.com/PatrickCmd/mlops-project",
    },
    caseStudy: true,
    featured: true,
    year: 2022,
  },
  {
    slug: "cloud-resume-challenge",
    title: "Serverless Portfolio Platform",
    problem:
      "The Cloud Resume Challenge asks for a static resume with a visitor counter; I built the full serverless product behind this site instead.",
    outcome:
      "FastAPI on Lambda with DynamoDB, Cognito-protected CMS for projects, posts, and certifications, visitor analytics, SAM and Ansible deploys, and 198 frontend tests.",
    tags: ["AWS Lambda", "FastAPI", "DynamoDB", "Cognito", "React", "SAM", "Ansible"],
    image: "/projects/cloud-resume-challenge.svg",
    imageAlt: "Serverless architecture illustration",
    links: {
      github: "https://github.com/PatrickCmd/cloud-resume-challenge",
      live: "https://patrickcmd.dev",
    },
    caseStudy: true,
    featured: true,
    year: 2025,
  },
  {
    slug: "sunbird-ai-inference",
    title: "Sunbird AI Inference APIs",
    problem:
      "Serve African-language LLM, translation, and speech models to developers through dependable public APIs.",
    outcome:
      "OpenAI-compatible endpoints, ASR/TTS backends, and an MCP server running on AWS and GCP Cloud Run with GPU inference across RunPod, Modal, and Hugging Face.",
    tags: ["FastAPI", "LLMs", "GCP Cloud Run", "Hugging Face", "MCP", "Terraform"],
    image: "/projects/sunbird-ai-inference.svg",
    imageAlt: "Model inference API illustration",
    links: {
      github: "https://github.com/SunbirdAI/sunbird-mcp",
      live: "https://sunbird.ai",
    },
    caseStudy: false,
    featured: true,
    year: 2025,
  },
  {
    slug: "mtn-rwanda-agriculture",
    title: "MTN Rwanda Agriculture Platform",
    problem:
      "Digitise farmer cooperatives, collections, and loans for farmers who mostly own feature phones.",
    outcome:
      "Django REST API and PostgreSQL schema for onboarding, collections, and shipments, plus a USSD module for collection and loan management, deployed with Docker and GitHub Actions.",
    tags: ["Django", "PostgreSQL", "USSD", "Docker", "GitHub Actions"],
    image: "/projects/mtn-rwanda-agriculture.svg",
    imageAlt: "Agriculture platform illustration",
    links: {},
    caseStudy: false,
    featured: true,
    year: 2022,
  },
  {
    slug: "blockbrite-payments",
    title: "Blockbrite Payment Gateway",
    problem:
      "Integrate bank transaction APIs into a payment gateway without breaking the existing user and M-Pesa modules.",
    outcome:
      "Bank integration layer and the unit and integration test suite covering the user, M-Pesa, and bank transaction modules.",
    tags: ["Django", "PostgreSQL", "Payments", "pytest"],
    image: "/projects/blockbrite-payments.svg",
    imageAlt: "Payment gateway illustration",
    links: {},
    caseStudy: false,
    featured: true,
    year: 2022,
  },
];

export const featuredProjects = projects.filter((p) => p.featured).slice(0, 6);

export function findProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
