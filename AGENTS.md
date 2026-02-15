# Agent Operating Guide

All automation, assistants, and developers must follow
`.github/copilot-instructions.md` for workflow, safety, and environment rules.

## How to Use

- Read `.github/copilot-instructions.md` before making changes
- Apply every rule in that file as-is; do not redefine or override them here
- If updates are needed, edit `.github/copilot-instructions.md` and keep this
  file pointing to it

## Quick Reference

- **Language**: TypeScript 5.9 / React 19 / Vite 7
- **Development branch**: `develop` (default working branch)
- **Production branch**: `master` (releases only, PR-only)
- **Lint before commit**: `npm run lint:all`
- **Format code**: `npm run format`
- **Type check**: `npm run type-check`
- **Build**: `npm run build`
- **Run dev**: `npm run dev`

## Development Workflow

1. Switch to develop: `git checkout develop && git pull origin develop`
2. **Rebase from master**: `git fetch origin master && git rebase origin/master`
3. Make changes to components in `src/`
4. Run `npm run lint:all`
5. Run `npm run type-check`
6. Test locally: `npm run dev`
7. Commit and push to `develop` or `feature/*` branch
8. Create PR to `master` when ready for production

## Project Structure

```text
otel-data-ui/
├── src/
│   ├── components/      # React components (layout, shared, ui)
│   ├── config/          # Runtime configuration
│   ├── contexts/        # Auth and Theme providers
│   ├── graphql/         # GraphQL query definitions
│   ├── lib/             # Apollo client, utilities
│   ├── pages/           # Page components
│   ├── services/        # Auth service
│   ├── App.tsx          # Router and providers
│   └── main.tsx         # Entry point
├── Dockerfile           # Multi-stage build (nginx)
├── nginx.conf           # SPA routing config
└── VERSION              # Release version
```
