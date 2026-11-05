# Portfolio Audit & Improvement Plan

Audit of the `frontend/` app behind https://patrickcmd.dev, done before any redesign work.
Date: 2026-11-05. Branch: `claude/funny-clarke-kranjz`.

---

## 1. What the site actually is

The brief assumes a simple Lovable landing page. The repo is bigger than that:

| Layer | What exists |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript, Tailwind 3, shadcn/ui (47 primitives in `src/components/ui`), React Router 6, TanStack Query 5, axios |
| Backend | FastAPI on AWS Lambda behind API Gateway (`api.patrickcmd.dev`), DynamoDB, Cognito auth. Lives in `backend/` |
| Infra | CloudFormation + Ansible + SAM in `aws/`. Frontend is S3 + CloudFront + Route 53, built by `aws/playbooks/s3-upload.yml` running `npm run build` locally |
| Public UX | GitHub-profile-style page: avatar header, then tabs Overview / Certifications / Projects / Blog / CV |
| Owner UX | Cognito login button in the header, owner Dashboard tab with charts, and in-page editors (create/edit/publish/unpublish/delete) for projects, certifications, and blog posts |
| Analytics | Visitor counter in the footer (Cloud Resume Challenge requirement), per-item view tracking |

The CMS and serverless backend are the substance of the Cloud Resume Challenge, so the plan below keeps them and moves them off the public landing page rather than deleting them.

## 2. Routes

Only two routes exist (`src/App.tsx`):

| Path | Component | Notes |
|---|---|---|
| `/` | `pages/Index.tsx` | All five tabs are React state (`activeTab`), not routes. No deep links, no back button, nothing for search engines beyond the Overview tab |
| `*` | `pages/NotFound.tsx` | Logs to console, links home |

CloudFront already maps 403/404 to `/index.html` (`aws/frontend.yaml` lines 228–236), so client-side routes such as `/projects/:slug` will work in production without infra changes.

## 3. Section components and their data sources

| Component | Rendered where | Data source | Verdict |
|---|---|---|---|
| `ProfileHeader.tsx` | Top of `/` | **Hardcoded JSX**: name, handle, tagline, GitHub, LinkedIn, email, location, employer, 6 skill chips, "2× AWS Certified" badge | Migrate to `content/profile.ts` |
| `TabNavigation.tsx` | Below header | Tab list hardcoded; fires three API list calls just to show counts | Replace with anchor nav |
| `OverviewTab.tsx` | Tab | **Hardcoded JSX**: three-paragraph summary, 7 skill chips, skills object (7 groups), 3 recent roles, education | Migrate to `profile.ts`, `skills.ts`, `experience.ts` |
| `ContributionGraph.tsx` | Overview tab | `Math.random()` on every mount: the graph is fake | Remove |
| `CVTab.tsx` | Tab | **Hardcoded JSX**: 9 roles with highlights, education. Duplicated again in `utils/generateResumePDF.ts` (jsPDF, 230 lines) | Single source in `experience.ts`; replace generated PDF with a static PDF |
| `ProjectsTab.tsx` (376 lines) + `ProjectDetail`, `ProjectEditor` | Tab | **Backend API** `/projects` via `hooks/useProjects` → `services/projectService` → `lib/apiClient`. Mock DB in `services/mockProjectsDatabase.ts` when `VITE_USE_MOCK_API=true`. Seed data in `backend/data/projects.json` (7 projects, 4 featured, none with images) | Featured grid from `projects.ts`; full API list moves to `/projects` |
| `CertificationsTab.tsx` + editor/detail | Tab | **Backend API** `/certifications`; mock DB has 9 entries. Renders an emoji `icon`, no Credly badge images | Compact badge row from `certifications.ts`; API list optional |
| `BlogTab.tsx` + `BlogEditor`, `MarkdownRenderer` | Tab | **Backend API** `/blogs`. `src/data/blogPosts.ts` (423 lines) is only used to seed the mock DB | Writing section from Hashnode; keep API blog behind `/blog` |
| `DashboardTab.tsx` | Tab, owner only | API analytics + recharts | Move to `/admin` |
| `VisitorCounter.tsx` | Footer | API `/visitors` (tracks on mount) | Keep in footer |
| `LoginDialog.tsx`, `UserMenu.tsx` | Header, every visitor | Cognito via `authService` | Move to `/admin`; hide from public header |
| `index.html` | — | Title "Patrick Walukagga \| Software Engineer", OG/Twitter images point at `lovable.dev`, `twitter:site` is `@Lovable`. No canonical, no JSON-LD, no sitemap | Item 1 |

Canonical copy for experience and skills lives in `docs/linkedin-resume.md`; the JSX is a hand-copied subset of it.

## 4. Baseline health

| Check | Result |
|---|---|
| `npm run lint` | **Fails: 160 errors, 10 warnings.** 154 are `no-explicit-any` (services, hooks, tests), 10 `react-refresh/only-export-components` (shadcn files), 2 `no-empty-object-type`, 1 `no-require-imports` in `tailwind.config.ts`. No `typecheck` script exists |
| `tsc -p tsconfig.app.json --noEmit` | Passes, but `strict: false` and `noImplicitAny: false` |
| `npm run build` | Passes with warnings: Google Fonts `@import` placed after `@tailwind` (ignored by PostCSS, so fonts load render-blocking), and the main chunk is **2.0 MB (642 kB gzip)** with no code splitting |
| `npm run test:run` | 198 tests in 11 files pass (hooks, services, auth context) |

Heavy dependencies on the public path: `jspdf` + `html2canvas` (resume generation), `recharts` (owner dashboard only), `react-syntax-highlighter` (blog markdown), all 27 Radix packages. The avatar is a 14 kB JPEG rendered at 256 px.

## 5. Other defects found

- Header and tab nav are both `sticky top-0`; the nav slides under the 56 px header when scrolling.
- `{tab.count && ...}` in `TabNavigation` renders a literal `0` when a list is empty.
- Theme defaults to `light` with a custom provider; `next-themes` is installed but only used by the Sonner toaster. The brief wants system default.
- `src/App.css` is the untouched Vite starter stylesheet; nothing imports it.
- `lovable-tagger` is a dev dependency and wired into `vite.config.ts`.
- `README.md` (frontend) still says the site is deployed on Lovable.
- Contact email is rendered in the header for every visitor and bot.
- Only one `<h1>` exists, but there are no `<section>` landmarks, no skip link, and focus styles are the shadcn defaults.
- `robots.txt` is fine; no `sitemap.xml`.

## 6. Decisions the brief does not cover

1. **Public page vs CMS.** Recommended: the landing page `/` becomes a single-scroll, content-file-driven page (hero → about → skills → experience → projects → certifications → writing → contact). The API-backed features keep working behind routes:
   - `/projects` full list from the API, `/projects/:slug` markdown case studies
   - `/blog`, `/blog/:slug` API-backed posts (existing editor)
   - `/admin` login + dashboard + editors (owner only; no login button on the public page)
   - Visitor counter stays in the footer.
2. **Resume PDF.** Replace client-side jsPDF generation with a static `public/Patrick-Walukagga-Resume.pdf`. Removes ~370 kB of JS from the bundle. Needs the PDF from you (or I generate one from `experience.ts` once, offline, and commit it).
3. **Lint baseline.** "Run lint each time" is meaningless while it is red. Proposal: a `chore` commit before item 0 that fixes the `require()` and empty-object errors, types the easy `any`s, and scopes `no-explicit-any` to `warn` in tests and services only. Alternatively I type everything (~150 edits).
4. **Hashnode.** Use Hashnode's public GraphQL API (`gql.hashnode.com`, no key) at build time via a `prebuild` script that writes `src/content/generated/posts.json`, with the committed JSON as the runtime fallback. The deploy playbook already runs `npm run build` on your machine, so build-time fetch works there.
5. **OG image.** Generate once with Playwright from an HTML template, commit `public/og.png`. No external service.
6. **Code splitting.** `React.lazy` for `/admin`, `/blog`, `/projects` chunks; `recharts` and the syntax highlighter leave the landing chunk. Target: landing JS under 250 kB gzip.
7. **CI.** No `.github/` workflows exist. Optional item 9: a GitHub Actions job running lint, typecheck, build, and tests on pull requests. Free, no new deps.
8. **Strict TypeScript** for `src/content/` only (via a nested tsconfig or explicit types + zod schemas) so content mistakes fail the build.

## 7. Information needed from you

- Hashnode blog URL (assumed `patrickcmd.hashnode.dev`; I could not reach it from this session).
- Credly profile URL and badge image URLs for the two AWS certifications.
- Resume PDF, or approval to generate one.
- Digital Twin project: one-line problem statement, tech stack, repo link, screenshot.
- MLOps project: name, problem, stack, outcome, links. It is not in the repo today.
- Two or three outcome bullets with numbers for Sunbird AI, Audersity, and HAMWE EA. The current bullets are activity descriptions ("working on", "contributing to"), which is the biggest content weakness for an AI-engineer positioning.
- X/Twitter handle for the contact section.
- Availability status for the hero pill (e.g. "Open to AI/ML engineering roles").

## 8. Execution order

| # | Commit | Scope |
|---|---|---|
| chore | Lint baseline green, remove `App.css`, fix font `@import` order, add `typecheck` script | Prerequisite |
| 0 | `src/content/` typed files; `ProfileHeader`, `OverviewTab`, `CVTab`, PDF util read from them | No visual change |
| 1 | Metadata: title, description, canonical, OG image, JSON-LD, sitemap, robots, Lovable removal | `index.html`, `public/`, build script |
| 2 | Hero | New `sections/Hero.tsx` |
| 3 | About + Skills | New sections |
| 4 | Experience timeline with "Show earlier roles" | New section, replaces CV tab |
| 5 | Projects grid + `/projects/:slug` markdown case studies | New section + route |
| 6 | Certifications row + Writing (Hashnode) | New sections + prebuild script |
| 7 | Contact + Footer | New sections |
| 8 | Global UI: sticky anchor nav, system theme, tokens, a11y, code splitting, Lighthouse | Layout + `App.tsx` routes (`/admin`, `/blog`, `/projects`) |
| docs | README `src/content/` section, CHANGELOG | Docs |

Each commit runs `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:run`.
