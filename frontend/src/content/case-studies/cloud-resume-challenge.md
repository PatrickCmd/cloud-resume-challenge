## Context

The [Cloud Resume Challenge](https://cloudresumechallenge.dev/) asks for a static resume with a serverless visitor counter. I used it as an excuse to build the full product behind this site: a public portfolio with a content management system that only I can log in to, visitor analytics, and infrastructure that is reproducible from the repository.

## Architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind and shadcn/ui, served from S3 through CloudFront on `patrickcmd.dev`.
- **API:** FastAPI on AWS Lambda via Mangum, behind API Gateway on `api.patrickcmd.dev`, with 34 endpoints across projects, blog posts, certifications, visitors, analytics and auth.
- **Data:** DynamoDB single-table design with GSIs for published/draft listings.
- **Auth:** Amazon Cognito user pool; JWT ID tokens carry a custom role claim that gates owner-only routes.
- **Infrastructure:** AWS SAM for the backend stack, CloudFormation for the frontend bucket, CloudFront distribution and Route 53 records, and Ansible playbooks that build, upload and invalidate.
- **Quality:** 198 frontend tests with Vitest and Testing Library; backend unit, integration and end-to-end suites that can run against the deployed API.

## Decisions

- **Static landing page, dynamic everything else.** The home page is rendered from typed content files in `src/content` so the first paint needs no API call; the CMS, blog and analytics live behind their own routes.
- **Single-table DynamoDB.** One table with composite keys keeps the stack cheap and the access patterns explicit, at the cost of some up-front modelling.
- **Mock services behind a flag.** Every API service has an in-memory twin selected by `VITE_USE_MOCK_API`, which keeps the frontend test suite fast and offline.
- **Owner-only UI, public API.** Draft content is filtered server-side; the frontend only requests drafts when a valid owner token is present.

## Results

- The site you are reading, with its visitor counter in the footer.
- Owner dashboard with publish/unpublish workflows for projects, posts and certifications.
- Repeatable deploys: `make` targets wrap the SAM and Ansible flows, and CloudFront invalidations are scoped to the two HTML paths a SPA needs.
- Source: [github.com/PatrickCmd/cloud-resume-challenge](https://github.com/PatrickCmd/cloud-resume-challenge).
