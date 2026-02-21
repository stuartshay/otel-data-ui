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

### Pages

- Dashboard, Locations, Location Detail
- Garmin Activities, Garmin Detail
- Unified Map (Leaflet), Daily Summary
- Reference Locations, Spatial Tools

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
npm run lint:all      # All linters (ESLint + markdownlint)
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run type-check    # TypeScript check
```

## Related Repositories

- [otel-data-gateway](https://github.com/stuartshay/otel-data-gateway) — GraphQL
  BFF (primary backend)
- [otel-data-api](https://github.com/stuartshay/otel-data-api) — REST API
- [k8s-gitops](https://github.com/stuartshay/k8s-gitops) — Kubernetes deployment
- [homelab-infrastructure](https://github.com/stuartshay/homelab-infrastructure) —
  Cognito auth infrastructure
