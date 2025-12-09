# Cloud Resume Challenge

This repository contains my implementation of the [Cloud Resume Challenge (AWS)](https://cloudresumechallenge.dev/docs/the-challenge/aws/) - a hands-on project that demonstrates cloud engineering skills by building and deploying a personal resume website using AWS services.

## Project Overview

The Cloud Resume Challenge is designed to help aspiring cloud engineers gain practical experience with:
- Frontend development
- Cloud infrastructure (AWS)
- Infrastructure as Code (IaC)
- CI/CD pipelines
- Serverless architecture
- Database integration
- Monitoring and logging

## Architecture

This project follows a serverless architecture on AWS, consisting of:
- **Frontend**: React-based portfolio website
- **Backend**: AWS Lambda functions with API Gateway
- **Database**: DynamoDB for visitor counter
- **Hosting**: S3 + CloudFront for static site hosting
- **DNS**: Route 53 for custom domain management
- **CI/CD**: GitHub Actions for automated deployments

## Frontend Development

### Building with Lovable.dev

For the frontend, I leveraged [Lovable.dev](https://lovable.dev) - an AI-powered web development platform that accelerates the creation of modern, responsive web applications.

**Initial Prompt Used:**

```
I want to create my personal page that looks like a github profile: https://github.com/PatrickCmd

userpic https://avatars.githubusercontent.com/u/6010217?v=4
name: Patrick Walukagga (PatrickCmd)

instead of "Overview, Repositories, Projects, Packages Stars" we can have "Overview, Certifications, Projects, CV"

Attached is my linked profile resume. 

Add toggle for dark/light theme
```

Attached resume [here](./frontend/docs/linkedin-resume.md)

**Design Approach:**

The frontend was designed to mimic the familiar GitHub profile interface while showcasing my professional information. Key features include:

- **GitHub-inspired Layout**: Clean, professional navigation with tabs for different content sections
- **Custom Sections**:
  - **Overview**: Professional summary and highlights
  - **Certifications**: Cloud and technical certifications
  - **Projects**: Portfolio of notable projects
  - **CV**: Downloadable resume/CV
- **Dark/Light Theme**: Toggle for user preference with theme persistence
- **Responsive Design**: Mobile-first approach ensuring compatibility across devices
- **Modern Tech Stack**: Built with React, TypeScript, Tailwind CSS, and shadcn-ui components

**Why Lovable.dev?**

Using Lovable.dev allowed me to:
- Rapidly prototype and iterate on design ideas
- Focus on cloud infrastructure rather than frontend boilerplate
- Generate production-ready, type-safe React code
- Implement modern UI patterns and accessibility standards
- Maintain code quality with TypeScript and component-based architecture

**Live Demo**: [https://patrick-persona-page.lovable.app/](https://patrick-persona-page.lovable.app/)

**Frontend Documentation**: See [frontend/README.md](frontend/README.md) for detailed setup and development instructions.

## Project Structure

```
cloud-resume-challenge/
├── frontend/           # React portfolio website
│   ├── src/
│   ├── public/
│   └── README.md
├── backend/            # AWS Lambda functions (coming soon)
├── infrastructure/     # IaC templates (coming soon)
└── .github/           # CI/CD workflows (coming soon)
```

## Implementation Progress

- [x] Frontend development
- [ ] AWS S3 static website hosting
- [ ] CloudFront distribution setup
- [ ] Custom domain with Route 53
- [ ] SSL/TLS certificate with ACM
- [ ] DynamoDB visitor counter
- [ ] Lambda function for visitor count API
- [ ] API Gateway integration
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Infrastructure as Code (Terraform/CloudFormation)
- [ ] Testing and monitoring

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- React Router
- TanStack Query

### Backend (Planned)
- AWS Lambda (Python/Node.js)
- API Gateway
- DynamoDB
- CloudWatch

### Infrastructure (Planned)
- AWS S3
- CloudFront
- Route 53
- ACM (Certificate Manager)
- Terraform or CloudFormation

### DevOps (Planned)
- GitHub Actions
- AWS CLI
- Infrastructure as Code

## Getting Started

### Frontend Setup

See the detailed instructions in [frontend/README.md](frontend/README.md).

Quick start:
```bash
cd frontend
npm install
npm run dev
```

## Deployment

Deployment instructions will be added as infrastructure components are implemented.

## License

This project is open source and available under the MIT License.

## Contact

Patrick Walukagga
- GitHub: [@PatrickCmd](https://github.com/PatrickCmd)
- Portfolio: https://patrick-persona-page.lovable.app/
- LinkedIn: [Patrick Walukagga](https://www.linkedin.com/in/patrick-walukagga/)

## Acknowledgments

- [Cloud Resume Challenge](https://exampro.co/) by ExamPro
- [Lovable.dev](https://lovable.dev) for frontend development platform