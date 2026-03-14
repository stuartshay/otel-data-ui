# Copilot Rules for otel-data-ui Repo

These rules ensure Copilot/assistants follow best practices for React frontend
development with Vite and TypeScript.

## Always Read First

- **README**: Read `README.md` for project overview and pages
- **env**: Load `.env.local` for GraphQL and Cognito configuration (gitignored)
- **pre-commit**: ALWAYS run `npm run lint:all` before commit/PR

## Project Overview

React frontend consuming the otel-data-gateway GraphQL BFF for location and
activity data visualization. Uses Apollo Client, Leaflet maps, Recharts, and
Tailwind CSS with shadcn/ui components.

## Target Infrastructure

| Property     | Value                                 |
| ------------ | ------------------------------------- |
| Language     | TypeScript 5.9 / React 19 / Vite 7    |
| GraphQL      | Apollo Client 4.x → otel-data-gateway |
| Styling      | Tailwind CSS 4.x / shadcn/ui          |
| Maps         | Leaflet 1.9 / react-leaflet 5.x       |
| Charts       | Recharts 3.x                          |
| Auth         | AWS Cognito (PKCE via oidc-client-ts) |
| K8s Cluster  | k8s-pi5-cluster                       |
| Namespace    | otel-data-ui                          |
| DNS          | data-ui.lab.informationcart.com       |
| Docker Image | stuartshay/otel-data-ui               |

## Development Workflow

### Branch Strategy

⚠️ **CRITICAL RULE**: NEVER commit directly to `master` branch. All changes
MUST go through `develop` or `feature/*` branches.

- **master**: Protected branch, production-only (PR required, direct commits
  FORBIDDEN)
- **develop**: Primary development branch (work here by default)
- **feature/\***: Feature branches (use for isolated features, PR to `master`)

### Before Starting Any Work

**ALWAYS sync your working branch with the remote before making changes:**

```bash
# If working on develop:
git checkout develop && git fetch origin && git pull origin develop

# If creating a new feature branch:
git checkout master && git fetch origin && git pull origin master
git checkout -b feature/my-feature
```

**ALWAYS rebase onto the latest protected branch before creating a PR:**

```bash
git fetch origin master && git rebase origin/master
```

### Before Creating a PR

⚠️ **ALWAYS check for and resolve conflicts before creating a PR:**

1. Rebase onto the latest protected branch:
   `git fetch origin master && git rebase origin/master`
2. Resolve any conflicts during rebase
3. Force-push the rebased branch: `git push origin <branch> --force-with-lease`
4. Verify the PR shows no conflicts on GitHub before requesting review

This is especially important after squash merges, which cause develop to
diverge from master.

### Issue-First Workflow

All work follows this lifecycle:

1. **Create a GitHub Issue** — Use the bug or feature request template
2. **Create a branch** — `develop` for small changes, `feature/*` for larger
   work
3. **Implement and test** — Write code, run `npm run lint:all` and
   `npm run type-check`
4. **Open a PR** — Reference the issue (`Closes #XX`), fill the PR template
5. **Merge to master** — After review and CI passes
6. **Auto-deploy** — Merge triggers Docker build → k8s-gitops dispatch →
   Argo CD sync

### Upstream Types Dependency PRs (Required)

⚠️ **ALWAYS verify auto-created PRs that bump
`@stuartshay/otel-graphql-types`.**

1. Confirm the PR was triggered by the upstream package publish workflow.
2. Verify `package.json` and lockfile bump to the expected released version.
3. Ensure required checks are green; if they fail, fix workflow/repo issues and
   rerun before merging.
4. Merge promptly once checks pass so UI stays aligned with gateway types.
5. Post a completion comment on the linked issue/PR confirming the types bump
   PR link, version, and merge status.

### After Deployment (Required)

⚠️ **ALWAYS verify linked issue acceptance criteria after cluster deployment**
before considering work complete.

1. Track the implementation issue linked to the code PR.
2. Complete deployment via the corresponding deployment PR (for example in
   `k8s-gitops`).
3. Validate each acceptance-criteria checkbox against the deployed cluster
   behavior (not only local tests/CI).
4. Post verification evidence on the issue (commands, API responses, logs, or
   screenshots as applicable).
5. Only then mark the issue/project item as done.

If an issue is auto-closed by merge keywords (`Closes #...`) before deployment
validation is complete, reopen it until acceptance criteria are confirmed.

### Release Hygiene Completion (Required)

⚠️ **ALWAYS complete issue/project hygiene before setting work to Done.**

1. Validate acceptance criteria against deployed behavior, not only local
   tests/CI.
2. If any earlier comment says validation is blocked, add a new superseding
   comment after resolution that explicitly states criteria are now met.
3. Ensure acceptance criteria are explicitly marked complete by either:
   - updating issue checkboxes, or
   - posting a final checklist comment mapping each criterion to evidence.
4. Include links in the final comment to code PR, deployment PR, and upstream
   types PR context when relevant.
5. Move the project item to `Done` only after the final validation evidence is
   posted.

Suggested final comment format:

```text
Final acceptance validation (YYYY-MM-DD):
- Criterion 1: PASS — <evidence link/command output>
- Criterion 2: PASS — <evidence link/command output>
- Deployment PR: <link>
- Types PR context (if applicable): <link>
- Prior blocker status: Resolved (<link>)
```

### PR Communication Requirements

⚠️ **ALWAYS leave/update GitHub comments for traceability:**

1. Add a status comment on the linked issue when implementation starts and when
   implementation is complete.
2. Add a PR comment summarizing what changed, validation performed, and any
   follow-up work.
3. Reply to **every** review comment thread with either:
   - the commit/fix applied, or
   - a short reason for not applying the suggestion.
4. Do not leave review threads without a response before merge.

### Daily Workflow

1. **ALWAYS** start from `develop` or create a feature branch
2. **Sync with remote** before making any changes (see above)
3. Run `npm install` to install dependencies
4. Run `npm run dev` for development server
5. Run `npm run lint:all` before commit
6. Run `npm run type-check` to validate types
7. Commit and push to `develop` or `feature/*` branch
8. **For feature branches**: rebase onto latest `master`: `git fetch origin master && git rebase origin/master`
9. Create PR to `master` when ready for deployment
10. **NEVER**: `git push origin master` or commit directly to master

## Writing Code

### Component Structure

- Page components in `src/pages/`
- Reusable components in `src/components/` (layout, shared, ui)
- GraphQL queries in `src/graphql/`
- Apollo client setup in `src/lib/`
- Auth and theme context providers in `src/contexts/`
- Runtime configuration in `src/config/`

### Best Practices

- Use TypeScript strict mode for all components
- Define GraphQL query types alongside queries
- Use Apollo `useQuery` / `useMutation` hooks
- Prefer shadcn/ui components from `src/components/ui/`
- Use Tailwind CSS utility classes for styling
- Environment variables must be prefixed with `VITE_`
- Never hardcode API URLs or auth credentials

### Spell Checking (cspell)

- The `cspell.json` `words` list **MUST always be sorted in strict alphabetical
  order** (case-insensitive)
- When adding a new word, insert it in its correct alphabetical position — do
  not append it to the end of the list

### Pages

- Dashboard, Locations, Location Detail
- Garmin Activities, Garmin Detail
- Unified Map (Leaflet), Daily Summary
- Reference Locations, Spatial Tools

## Project Structure

```text
otel-data-ui/
├── src/
│   ├── main.tsx             # App entry point
│   ├── App.tsx              # Root component + provider tree
│   ├── index.css            # Tailwind CSS entry
│   ├── components/          # Reusable UI components
│   │   ├── garmin/          # Garmin-specific components
│   │   ├── layout/          # Header, sidebar, navigation
│   │   ├── shared/          # Cross-page shared components
│   │   └── ui/              # shadcn/ui primitives
│   ├── pages/               # Page-level components (routes)
│   ├── graphql/             # GraphQL operation definitions
│   ├── __generated__/       # Codegen output (do not edit manually)
│   ├── contexts/            # React context providers (Auth, Theme)
│   ├── config/              # Runtime configuration
│   ├── lib/                 # Apollo client, utilities
│   ├── services/            # Auth service helpers
│   └── test/                # Test setup and utilities
├── e2e/                     # Playwright end-to-end tests
├── codegen.ts               # GraphQL codegen configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── Dockerfile               # Container image (nginx)
├── Makefile                 # Build automation
└── setup.sh                 # Dev environment bootstrap
```

## Local Development Services

⚠️ **ALWAYS start local services in hot-reload mode.** Never use production
mode for local development.

- **Start command**: `make dev` (runs Vite with HMR)
- **Port**: 5173
- **Hot reload**: Vite HMR — instant browser refresh on file changes
- Do NOT use `npm run build && npm run preview` for development

When starting the full local stack, start services in this order:

1. `otel-data-api` — `make dev` (port 8080)
2. `otel-data-gateway` — `make dev` (port 4000)
3. `otel-data-ui` — `make dev` (port 5173)

## Safety Rules (Do Not)

- ⛔ **NEVER commit directly to master branch**
- Do not commit secrets, `.env.local`, or auth tokens
- Do not use `latest` Docker tags in deployments
- Do not skip `npm run lint:all` before commits
- Do not hardcode API URLs or Cognito credentials
- Do not import from `node_modules` paths directly

## Quick Commands

```bash
npm run dev           # Development server (port 5173)
npm run build         # Production build
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run lint:all      # All linters (ESLint + markdownlint + cspell)
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run type-check    # TypeScript check
```

## CI/CD Pipelines

| Workflow           | File                     | Triggers                                    | Checks                                                                                 |
| ------------------ | ------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Lint and Validate  | `lint.yml`               | push/PR to `master` and `develop`           | ESLint, markdownlint, cspell, TypeScript, build, hadolint, npm audit, tests + coverage |
| Docker             | `docker.yml`             | push to `master`, PR to `master`/`develop`  | Build Docker image, push to Docker Hub on master                                       |
| Update Types       | `update-types.yml`       | `repository_dispatch` / `workflow_dispatch` | Auto-PR when `@stuartshay/otel-graphql-types` is published                             |
| Auto Approve       | `auto-approve.yml`       | `pull_request_target`                       | Auto-approves PRs from stuartshay, renovate[bot], dependabot[bot]                      |
| Validate PR Branch | `validate-pr-branch.yml` | PR targeting `master` only                  | Ensures PRs target correct base branch                                                 |

**Replicate CI locally before pushing:**

```bash
npm run lint:all         # ESLint + markdownlint + cspell
npm run type-check       # TypeScript validation
npm run build            # Production build
npm run test:coverage    # Vitest with coverage
```

## Issue Templates

Issue templates live in `.github/ISSUE_TEMPLATE/` and are a **living document**
— update them as the project evolves.

| Template        | File                  | Purpose                                                      |
| --------------- | --------------------- | ------------------------------------------------------------ |
| Bug Report      | `bug_report.yml`      | UI bugs — page, component, steps, browser, environment       |
| Feature Request | `feature_request.yml` | New pages/components — design, GraphQL queries, styling      |
| Performance     | `performance.yml`     | Slow renders, bundle size, lighthouse — metrics, environment |

When filing issues, use the appropriate template. Blank issues are disabled to
enforce structured intake. When adding new pages or changing the project
structure, update the templates to reflect the changes.

## Related Repositories

- [otel-data-gateway](https://github.com/stuartshay/otel-data-gateway) — GraphQL
  BFF (primary backend)
- [otel-data-api](https://github.com/stuartshay/otel-data-api) — REST API
- [k8s-gitops](https://github.com/stuartshay/k8s-gitops) — Kubernetes deployment
- [homelab-infrastructure](https://github.com/stuartshay/homelab-infrastructure) —
  Cognito auth infrastructure
