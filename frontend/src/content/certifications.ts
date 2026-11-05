/**
 * Certifications and courses. `badge` is a public path to the badge image;
 * `credentialUrl` links to the verifiable record (Credly) when known.
 */

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  badge?: string;
  credentialUrl: string | null;
  /** Shown in the compact badge row on the home page. */
  featured: boolean;
}

export const certifications: Certification[] = [
  {
    id: "aws-saa",
    name: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    year: 2023,
    badge: "/badges/aws-solutions-architect-associate.svg",
    credentialUrl: null,
    featured: true,
  },
  {
    id: "aws-ccp",
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    year: 2023,
    badge: "/badges/aws-cloud-practitioner.svg",
    credentialUrl: null,
    featured: true,
  },
  {
    id: "pcep",
    name: "PCEP – Certified Entry-Level Python Programmer",
    issuer: "Python Institute",
    year: 2022,
    credentialUrl: null,
    featured: false,
  },
  {
    id: "aws-bootcamp",
    name: "AWS Cloud Project Bootcamp (Teal Squad)",
    issuer: "ExamPro / AWS",
    year: 2023,
    credentialUrl: null,
    featured: false,
  },
  {
    id: "wqu-ads",
    name: "Applied Data Science Lab",
    issuer: "WorldQuant University",
    year: 2022,
    credentialUrl: null,
    featured: false,
  },
  {
    id: "gh-copilot",
    name: "GitHub Copilot Fundamentals",
    issuer: "GitHub",
    year: 2024,
    credentialUrl: null,
    featured: false,
  },
];

export const featuredCertifications = certifications.filter((c) => c.featured);
