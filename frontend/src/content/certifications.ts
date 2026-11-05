/**
 * Certifications and courses, newest first. `badge` is a public path to the official badge
 * image (Credly artwork, 340×340); `credentialUrl` is the verifiable record.
 * `featured` entries form the badge row on the home page; the rest render as a linked list.
 */

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  /** Year earned, used in the UI and the resume. */
  year: number;
  /** Full ISO date when known. */
  earned?: string;
  kind: "certification" | "course";
  badge?: string;
  credentialUrl: string | null;
  featured: boolean;
}

export const certifications: Certification[] = [
  {
    id: "rag-deeplearning-ai",
    name: "Retrieval Augmented Generation (RAG)",
    issuer: "DeepLearning.AI on Coursera",
    year: 2026,
    earned: "2026-01-06",
    kind: "course",
    credentialUrl: "https://coursera.org/share/dd73a266c9b1de5c4f1085bec6126480",
    featured: false,
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    issuer: "GitHub",
    year: 2025,
    earned: "2025-06-14",
    kind: "certification",
    badge: "/badges/github-copilot.png",
    credentialUrl: "https://www.credly.com/badges/19708e1d-6af0-4d52-bc0e-9b3c045bca54/public_url",
    featured: true,
  },
  {
    id: "lfs250-kubernetes",
    name: "LFS250: Kubernetes and Cloud Native Essentials",
    issuer: "The Linux Foundation",
    year: 2025,
    earned: "2025-05-25",
    kind: "certification",
    badge: "/badges/lfs250-kubernetes.png",
    credentialUrl: "https://www.credly.com/badges/10c079e0-46e6-4580-8d84-72fa598832b2/public_url",
    featured: true,
  },
  {
    id: "genai-bootcamp",
    name: "GenAI Bootcamp (Gold Squad)",
    issuer: "ExamPro",
    year: 2025,
    earned: "2025-04-24",
    kind: "certification",
    credentialUrl: "https://app.exampro.co/validate/certificate/Ow5KM33PJFRPzL89S4cXYA9c43",
    featured: false,
  },
  {
    id: "llm-zoomcamp",
    name: "LLM Zoomcamp",
    issuer: "DataTalks.Club",
    year: 2024,
    earned: "2024-10-17",
    kind: "course",
    credentialUrl:
      "https://certificate.datatalks.club/llm-zoomcamp/2024/e3e96b99b0079b6b3d272b8eeb2c1c8708f1c206.pdf",
    featured: false,
  },
  {
    id: "aws-saa",
    name: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    year: 2024,
    earned: "2024-03-04",
    kind: "certification",
    badge: "/badges/aws-solutions-architect-associate.png",
    credentialUrl: "https://www.credly.com/badges/492d908f-4382-4988-9bc9-40fa96794ed4/public_url",
    featured: true,
  },
  {
    id: "cil-zero-to-techie",
    name: "Zero-to-Techie (Data Engineering)",
    issuer: "CIL Academy",
    year: 2023,
    earned: "2023-11-17",
    kind: "course",
    badge: "/badges/cil-zero-to-techie.png",
    credentialUrl: "https://www.credly.com/badges/089aaa72-b185-4475-b580-49c0fbd162a9/public_url",
    featured: false,
  },
  {
    id: "terraform-bootcamp",
    name: "Terraform Beginner Bootcamp (Terraformer)",
    issuer: "ExamPro",
    year: 2023,
    earned: "2023-10-18",
    kind: "certification",
    credentialUrl: "https://app.exampro.co/validate/certificate/NpjLXk3K7Jou9irKBpLwSw9c43",
    featured: false,
  },
  {
    id: "aws-bootcamp",
    name: "AWS Cloud Project Bootcamp (Teal Squad)",
    issuer: "ExamPro",
    year: 2023,
    earned: "2023-09-05",
    kind: "certification",
    credentialUrl: "https://app.exampro.co/validate/certificate/6_8Bx0gHK7aXzJbkR34w8g9c43",
    featured: false,
  },
  {
    id: "wqu-ads-lab",
    name: "Applied Data Science Lab",
    issuer: "WorldQuant University",
    year: 2023,
    earned: "2023-01-11",
    kind: "course",
    badge: "/badges/wqu-applied-data-science-lab.png",
    credentialUrl: "https://www.credly.com/badges/3088b0a3-9b60-46dc-8a96-ae3a96f536d6/public_url",
    featured: false,
  },
  {
    id: "mlops-zoomcamp",
    name: "MLOps Zoomcamp",
    issuer: "DataTalks.Club",
    year: 2022,
    earned: "2022-09-01",
    kind: "course",
    credentialUrl:
      "https://certificate.datatalks.club/mlops-zoomcamp/2022/f398cbc3741745489d447539cc0d59969f7432c5.pdf",
    featured: false,
  },
  {
    id: "aws-ccp",
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    year: 2022,
    earned: "2022-06-25",
    kind: "certification",
    badge: "/badges/aws-cloud-practitioner.png",
    credentialUrl: "https://www.credly.com/badges/ede06de5-d388-498c-aadd-dfb34cbc2a84/public_url",
    featured: true,
  },
  {
    id: "pcep",
    name: "PCEP – Certified Entry-Level Python Programmer",
    issuer: "Python Institute",
    year: 2022,
    earned: "2022-02-04",
    kind: "certification",
    badge: "/badges/pcep.png",
    credentialUrl: "https://www.credly.com/badges/58ed25fe-0c86-44ad-8ea9-5af801e8c588/public_url",
    featured: true,
  },
  {
    id: "wqu-ads-1",
    name: "Applied Data Science I: Scientific Computing & Python (with honors)",
    issuer: "WorldQuant University",
    year: 2021,
    earned: "2021-06-22",
    kind: "course",
    badge: "/badges/wqu-applied-data-science-1.png",
    credentialUrl: "https://www.credly.com/badges/5a80da2b-bdde-41ac-af1f-33a562a6c053/public_url",
    featured: false,
  },
];

/** Badge row order: AWS first, then the other credentials with official artwork. */
const featuredOrder = ["aws-saa", "aws-ccp", "lfs250-kubernetes", "github-copilot", "pcep"];
export const featuredCertifications = featuredOrder
  .map((id) => certifications.find((c) => c.id === id))
  .filter((c): c is Certification => Boolean(c && c.featured));
