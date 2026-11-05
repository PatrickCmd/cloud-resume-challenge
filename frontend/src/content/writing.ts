/**
 * Static fallback for the Writing section. The section first asks the blog API for the
 * latest published posts; when the API is unreachable or empty it shows these.
 * Keep the newest post first.
 */

export interface WritingEntry {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, YYYY-MM-DD */
  publishedAt: string;
  readTime?: string;
  tags: string[];
  /** Absolute URL when the post lives elsewhere; otherwise the site serves /blog/<slug>. */
  url?: string;
}

export const writingFallback: WritingEntry[] = [
  {
    slug: "my-cloud-resume-challenge-journey",
    title: "My Cloud Resume Challenge Journey: Building a Full-Stack Serverless Portfolio on AWS",
    excerpt:
      "What it took to go from a static resume to a production serverless portfolio: CloudFront, Lambda, DynamoDB, Cognito, SAM, and the lessons along the way.",
    publishedAt: "2025-01-15",
    readTime: "15 min read",
    tags: ["AWS", "Serverless", "FastAPI", "React"],
  },
];
