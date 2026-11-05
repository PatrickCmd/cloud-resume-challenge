## Context

Recruiters and hiring managers kept asking the same questions about my background, often outside my time zone. I wanted something that answers them in my own voice, around the clock, and never invents a fact. The result is [digital-twin.patrickcmd.dev](https://digital-twin.patrickcmd.dev): a chat interface backed by an LLM that only knows what I have written about myself.

## Architecture

- **Frontend:** Next.js static export served from S3 through CloudFront.
- **Backend:** FastAPI on AWS Lambda behind API Gateway, using the Bedrock Converse API (Amazon Nova Lite by default).
- **Knowledge base:** a single `profile.json` for facts and links plus markdown notes generated from my LinkedIn export, concatenated into the system prompt at build time.
- **State:** conversations, thumbs-up/down feedback and contact-form messages are written to S3 as JSON; an optional DynamoDB table shares the rate limit across Lambda instances.
- **Delivery:** Terraform for every AWS resource, GitHub Actions with OIDC roles for `terraform plan` on pull requests and apply on deploy, and a protected `prod` environment.

## Decisions

- **Grounding over cleverness.** The prompt is first person, answers only from the material, and marks recruiter logistics it does not know as unknown instead of guessing. Temperature sits at 0.4.
- **A regression eval instead of vibes.** `eval_twin.py` runs ten questions pulled from a real review (for example "What did you do at Sunbird AI?") against local, dev and prod, and the deploy fails if an answer drifts.
- **Hardening before features.** Message length caps, UUID session ids, a 60-message session limit, per-client rate limiting, CORS pinned to the site origins and a Lambda IAM policy reduced to `bedrock:InvokeModel*` plus one bucket.
- **One source of truth for facts.** The same `profile.json` feeds the UI header, the JSON-LD, the sitemap and the prompt, so nothing is typed twice.

## Results

- Live in production with dev and prod environments, both deploying from `main`.
- 10/10 on the grounding eval on dev and prod after the prompt rewrite.
- Feedback and contact messages land in S3 and, when enabled, in my inbox via SES.
- Source: [github.com/PatrickCmd/digital-twin](https://github.com/PatrickCmd/digital-twin).
