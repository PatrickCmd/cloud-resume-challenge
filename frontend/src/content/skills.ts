/**
 * Skills grouped the way the Skills section renders them. Order matters.
 */

export interface SkillGroup {
  id: "backend" | "data" | "cloud" | "ai";
  title: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "backend",
    title: "Backend",
    items: [
      "Python",
      "FastAPI",
      "Django & Django REST Framework",
      "Flask",
      "GraphQL",
      "REST API design",
      "PostgreSQL",
      "Redis & Celery",
      "Testing (pytest)",
    ],
  },
  {
    id: "data",
    title: "Data",
    items: [
      "SQL",
      "Pandas & NumPy",
      "ETL pipelines",
      "Prefect & Airflow",
      "MLflow experiment tracking",
      "DynamoDB single-table design",
      "MySQL",
    ],
  },
  {
    id: "cloud",
    title: "Cloud & Infra",
    items: [
      "AWS (Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront, SAM)",
      "GCP Cloud Run",
      "Terraform",
      "CloudFormation & Ansible",
      "Docker & Kubernetes",
      "GitHub Actions CI/CD",
      "Nginx & Gunicorn",
      "Bash",
    ],
  },
  {
    id: "ai",
    title: "AI / ML",
    items: [
      "LLM-backed services (prompting, tools, structured output)",
      "AWS Bedrock & OpenAI-compatible APIs",
      "Model Context Protocol (MCP) servers",
      "Production inference on GPU platforms (RunPod, Modal, Vast.ai, Hugging Face)",
      "ASR / TTS backends",
      "RAG & evaluation harnesses",
      "scikit-learn & MLOps tooling",
    ],
  },
];

/** Short list for compact places such as the hero or resume header. */
export const coreStack = ["Python", "FastAPI", "Django", "PostgreSQL", "AWS", "Terraform", "Docker", "LLMs"];
