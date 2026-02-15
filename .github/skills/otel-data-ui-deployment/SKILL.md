---
name: otel-data-ui-deployment
description: Deploy and manage the otel-data-ui React frontend. Covers PR merges, Docker builds, k8s-gitops manifest updates, Argo CD sync, and live deployment validation on k8s-pi5-cluster.
---

# otel-data-ui Deployment Workflow

This skill manages the complete deployment lifecycle of the otel-data-ui
React frontend, from code merge to production validation on k8s-pi5-cluster.

## When to Use

Use this skill when you need to:

- Merge a PR and deploy a new version of otel-data-ui
- Update Kubernetes manifests via GitOps
- Validate a live deployment (health, version, runtime config)
- Troubleshoot deployment failures (Docker build, Argo CD sync, pod issues)
- Roll back to a previous version

## Architecture Overview

```text
GitHub (stuartshay/otel-data-ui)
  → PR merge to master
    → GitHub Actions (docker.yml)
      → Docker Hub (stuartshay/otel-data-ui:<version>)
        → k8s-gitops manifest update (deployment.yaml + configmap.yaml)
          → Argo CD auto-sync / manual sync
            → k8s-pi5-cluster (namespace: otel-data-ui)
              → https://data-ui.lab.informationcart.com
```

**Key Components**:

- **Frontend**: React 19 / TypeScript 5.9 / Vite 7 / Apollo Client 4
- **Serving**: nginx (SPA routing, plain text /health endpoint)
- **Runtime Config**: `entrypoint.sh` generates `config.js` with `window.__ENV__`
  from container environment variables at startup
- **Auth**: AWS Cognito PKCE OAuth2 (redirect URI in ConfigMap)
- **Docker**: Multi-arch (amd64/arm64) images on Docker Hub, node:24-alpine build
  → nginx:alpine serve
- **Deployment**: Kubernetes (1 replica, RollingUpdate, non-root nginx)
- **GitOps**: k8s-gitops → Argo CD auto-sync
- **Domain**: data-ui.lab.informationcart.com (MetalLB 192.168.1.100)

## Runtime Configuration Pattern

Unlike typical React apps where environment is baked at build time, otel-data-ui
uses a **runtime configuration** pattern:

1. **Build time**: Vite builds static assets (no env vars baked in)
2. **Container startup**: `entrypoint.sh` reads env vars from ConfigMap and
   generates `/usr/share/nginx/html/config.js`
3. **Browser**: App reads `window.__ENV__` for GraphQL URL, Cognito settings,
   and version

This means **version and config updates** require changes to the ConfigMap
(not just the image tag), and the pod must restart to regenerate `config.js`.

### Runtime Config Variables

| Variable                    | Source    | Default                                   |
| --------------------------- | --------- | ----------------------------------------- |
| `VITE_GRAPHQL_URL`          | ConfigMap | `https://gateway.lab.informationcart.com` |
| `VITE_COGNITO_DOMAIN`       | Hardcoded | `homelab-auth.auth.us-east-1...`          |
| `VITE_COGNITO_CLIENT_ID`    | Hardcoded | `5j475mtdcm4qevh7q115qf1sfj`              |
| `VITE_COGNITO_REDIRECT_URI` | ConfigMap | `http://localhost:5173/callback`          |
| `VITE_COGNITO_ISSUER`       | Hardcoded | `https://cognito-idp.us-east-1...`        |
| `VITE_APP_VERSION`          | ConfigMap | `dev`                                     |
| `VITE_APP_NAME`             | Hardcoded | `otel-data-ui`                            |

## Versioning Scheme

| Component    | Format                   | Example         |
| ------------ | ------------------------ | --------------- |
| VERSION file | `major.minor`            | `1.0`           |
| Docker tag   | `major.minor.run_number` | `1.0.7`         |
| SHA tag      | `sha-<7char>`            | `sha-a1b2c3d`   |
| Branch build | `major.minor.run-branch` | `1.0.8-develop` |

The `run_number` is the GitHub Actions workflow run number, auto-incremented
per workflow. Master pushes produce `VERSION.run_number` tags.

## Repository References

| Repo                      | Purpose            | Key Path                                          |
| ------------------------- | ------------------ | ------------------------------------------------- |
| `stuartshay/otel-data-ui` | Frontend source    | `src/`, `VERSION`, `.github/workflows/docker.yml` |
| `stuartshay/k8s-gitops`   | K8s manifests      | `apps/base/otel-data-ui/`                         |
| Docker Hub                | Container registry | `stuartshay/otel-data-ui`                         |

## Upstream & Downstream Dependencies

### Upstream (consumed by this service)

| Dependency                     | Type        | Impact                                   |
| ------------------------------ | ----------- | ---------------------------------------- |
| `stuartshay/otel-data-gateway` | GraphQL API | All data queries via Apollo Client       |
| AWS Cognito                    | Auth        | OAuth2 PKCE login flow, token management |

### Downstream (consumes this service)

None — this is the end-user-facing frontend.

**Before breaking changes**: Verify that modified GraphQL queries in
`src/graphql/` match the gateway schema (`src/schema/typeDefs.ts` in
otel-data-gateway).

## Agent-Assisted Deployment Flow

When an agent executes a deployment, it **MUST pause at every PR** for user
review before proceeding. The agent never merges PRs autonomously.

### Flow Overview

```text
1. Pre-deployment checks (rebase, lint, type-check, build)
2. Commit & push to develop
3. Create PR (develop → master)
   ⏸️ PAUSE — Present PR link, CI status, and diff summary to user
   → User reviews and merges PR
4. Wait for Docker build CI to complete → determine version tag
5. k8s-gitops auto-creates version update PR via repository_dispatch
   ⏸️ PAUSE — Present auto-created PR link, CI status, and diff to user
   → User reviews and merges k8s-gitops PR
6. Validate Argo CD sync and live deployment
7. If Copilot review comments exist on any PR:
   - Analyze each comment for validity
   - Fix valid suggestions, dismiss invalid ones with rationale
   - Push fixes and reply to threads
   ⏸️ PAUSE — Present updated PR for re-review if changes were made
```

### PAUSE Point Requirements

At each ⏸️ PAUSE, the agent must present:

| Item            | Details                                        |
| --------------- | ---------------------------------------------- |
| PR link         | Full GitHub URL                                |
| Branch          | Source → target (e.g., `develop` → `master`)   |
| Changes summary | Files changed and brief description            |
| CI status       | All check names with pass/fail/pending         |
| Review status   | Approved / pending / changes requested         |
| Mergeable       | Yes/No with merge state                        |
| Blocking items  | Any unresolved conversations or failing checks |

The agent **waits for the user to confirm the merge** before proceeding to
the next step. Never assume a PR is merged — verify via API after user
confirmation.

### k8s-gitops Auto-PR Mechanism

When the Docker build completes, the CI workflow dispatches a
`repository_dispatch` event (type: `otel-data-ui-release`) to
`stuartshay/k8s-gitops`. This triggers an automated workflow that:

1. Creates a branch `update-otel-data-ui-<version>`
2. Runs `update-version.sh <version>` to update VERSION, deployment.yaml
3. Creates a PR to `master` with title "Update otel-data-ui to v\<version\>"
4. CI checks and Copilot review run automatically

**Important for otel-data-ui**: The auto-PR updates `deployment.yaml` but may
not update `configmap.yaml` (`VITE_APP_VERSION`). Verify the auto-PR diff
includes the ConfigMap update — if not, the agent must add it manually before
presenting the PR for review.

The agent should check for this auto-created PR rather than manually creating
one. Use: `gh pr list --repo stuartshay/k8s-gitops --state open`

## Deployment Procedure

### Step 1: Pre-Deployment Checks

Before merging any PR, verify:

```bash
# 0. Bootstrap local environment (first time or after dependency changes)
cd /home/ubuntu/git/otel-data-ui
./setup.sh
# This installs deps, configures Husky pre-commit hooks (lint-staged),
# and validates the build

# 1. Always rebase develop onto master before committing/pushing
cd /home/ubuntu/git/otel-data-ui
git fetch origin master
git rebase origin/master
# Resolve any conflicts, then: git rebase --continue
# If rebased, push with: git push origin develop --force-with-lease

# 2. Install dependencies
npm ci

# 3. ESLint
npm run lint

# 4. TypeScript check
npm run type-check

# 5. Markdown lint (if available)
npm run lint:md

# 6. Build succeeds
npm run build

# 7. Local dev server starts
npm run dev
# Visit http://localhost:5173/ in browser
```

**Checklist**:

- [ ] Rebased onto master (`git fetch origin master && git rebase origin/master`)
- [ ] ESLint clean (`npm run lint`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] VERSION file contains valid `major.minor` format
- [ ] No unencrypted secrets in code
- [ ] No hardcoded API URLs (use `window.__ENV__`)

### Step 2: Merge PR to Master

```bash
# Via GitHub CLI or API
# Always use squash merge to keep clean history
gh pr merge <PR_NUMBER> --squash --repo stuartshay/otel-data-ui
```

**Rules**:

- Never commit directly to `master` — always use PRs
- Use squash merge to maintain clean commit history
- Branch protection requires all 4 CI status checks to pass
- All PRs are reviewed manually before merge (no auto-approve)

#### Post-Merge: Rebase develop onto master

Squash merges create a new commit on master that doesn't exist on develop,
causing branch divergence. Always rebase develop after merging:

```bash
git checkout develop
git fetch origin master
git rebase origin/master
git push origin develop --force-with-lease
```

Skipping this causes merge conflicts on the next PR.

### Step 3: Wait for Docker Build

The merge triggers `.github/workflows/docker.yml` which:

1. Reads `VERSION` file (e.g., `1.0`)
2. Computes tag: `VERSION.run_number` (e.g., `1.0.7`)
3. Runs `npm ci` and `npm run build` (Vite build)
4. Builds multi-arch image (linux/amd64, linux/arm64) using QEMU
5. Pushes to Docker Hub with tags: `<version>`, `latest`, `sha-<commit>`
6. Dispatches `otel-data-ui-release` event to k8s-gitops

**Verification**:

```bash
# Check GitHub Actions status and get run_number via CLI (preferred)
gh run list --workflow docker.yml --repo stuartshay/otel-data-ui --limit 3
# The run_number in the output is appended to VERSION to form the Docker tag
# e.g., run_number=7 → Docker tag 1.0.7

# Or check via browser (wait ~4-5 minutes after merge)
# https://github.com/stuartshay/otel-data-ui/actions/workflows/docker.yml

# Fallback: scan Docker Hub if run_number is unknown
for i in $(seq 5 15); do
  result=$(docker manifest inspect stuartshay/otel-data-ui:1.0.$i 2>&1 | head -1)
  if [[ "$result" == "{" ]]; then echo "FOUND: 1.0.$i"; fi
done

# Or verify using the merge commit SHA
docker manifest inspect stuartshay/otel-data-ui:sha-<commit_sha_7char>

# Confirm matching digests
docker manifest inspect stuartshay/otel-data-ui:<version> | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['manifests'][0]['digest'])"
```

### Step 4: Update k8s-gitops Manifests

**Critical**: otel-data-ui has **3 version update points** across 2 files:

| File              | Field                            | Purpose              |
| ----------------- | -------------------------------- | -------------------- |
| `deployment.yaml` | `app.kubernetes.io/version`      | Resource label       |
| `deployment.yaml` | `image: stuartshay/otel-data-ui` | Container image tag  |
| `configmap.yaml`  | `VITE_APP_VERSION`               | Runtime config value |

```bash
cd /home/ubuntu/git/k8s-gitops

# 1. Sync develop branch
git checkout develop && git fetch origin && git pull origin develop

# 2. Rebase onto master if needed (squash merges cause divergence)
git fetch origin master
git rebase origin/master

# 3. Update deployment (option A: script — recommended)
cd apps/base/otel-data-ui
./update-version.sh <NEW_VERSION>

# 3. Update deployment (option B: manual — 3 places across 2 files)
# In deployment.yaml:
#   - metadata.labels.app.kubernetes.io/version: "<NEW_VERSION>"
#   - spec.template.spec.containers[0].image: stuartshay/otel-data-ui:<NEW_VERSION>
# In configmap.yaml:
#   - data.VITE_APP_VERSION: "<NEW_VERSION>"

# 4. Commit and push
cd /home/ubuntu/git/k8s-gitops
git add apps/base/otel-data-ui/
git commit -m "chore: Update otel-data-ui to v<NEW_VERSION>"
git push origin develop  # or --force-with-lease if rebased

# 5. Create PR to master
gh pr create --base master --head develop \
  --title "chore: Update otel-data-ui to v<NEW_VERSION>" \
  --repo stuartshay/k8s-gitops

# 6. Wait for CI checks AND GitHub Copilot code review before merge
# CI status checks take ~60-90 seconds
# GitHub Copilot code review takes ~5+ minutes (runs automatically)
# All Copilot review comments must be resolved before merge is allowed
gh pr merge <PR_NUMBER> --squash --repo stuartshay/k8s-gitops
```

#### Post-Merge: Rebase k8s-gitops develop onto master

Same as otel-data-ui, squash merges cause branch divergence. Always rebase
k8s-gitops develop after merging a PR to master:

```bash
cd /home/ubuntu/git/k8s-gitops
git checkout develop
git fetch origin master
git rebase origin/master
git push origin develop --force-with-lease
```

**Why the ConfigMap matters**: The `entrypoint.sh` reads `VITE_APP_VERSION`
from the environment (sourced from ConfigMap) to generate `config.js`. If you
only update the image tag without updating the ConfigMap, the app will display
the old version string.

### Step 5: Argo CD Sync

After merging to k8s-gitops master:

```bash
# Option A: Wait for auto-sync (up to 3 minutes)

# Option B: Force sync via argocd CLI
kubectl config set-context --current --namespace=argocd

# Hard refresh to detect new commit
argocd app get apps --core --hard-refresh

# If OutOfSync, trigger sync
argocd app sync apps --core --timeout 120

# If sync is stuck ("another operation in progress")
argocd app terminate-op apps --core
sleep 5
argocd app sync apps --core --force --timeout 180
```

#### Alternative: kubectl CRD Inspection

If the `argocd` CLI hangs or DNS doesn't resolve from your host, use kubectl
to inspect the Argo CD Application CRD directly:

```bash
# Check sync status via Application CRD
kubectl get application apps -n argocd \
  -o jsonpath='{.status.sync.status}' && echo
# Expected: Synced

# Check health status
kubectl get application apps -n argocd \
  -o jsonpath='{.status.health.status}' && echo
# Expected: Healthy

# Full status summary
kubectl get application apps -n argocd \
  -o jsonpath='Sync: {.status.sync.status}, Health: {.status.health.status}, Revision: {.status.sync.revision}' && echo
```

#### Alternative: Argo CD REST API

The Argo CD server is a ClusterIP service exposed via ingress at
`argocd.lab.informationcart.com` (IP: 192.168.1.100). DNS may not resolve
from the host, so use the IP with a Host header:

```bash
# 1. Authenticate
ARGOCD_TOKEN=$(curl -sk \
  -H "Host: argocd.lab.informationcart.com" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<password>"}' \
  https://192.168.1.100/api/v1/session | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Check app status
curl -sk \
  -H "Host: argocd.lab.informationcart.com" \
  -H "Authorization: Bearer $ARGOCD_TOKEN" \
  https://192.168.1.100/api/v1/applications/apps \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    print(f\"Sync: {d['status']['sync']['status']}, Health: {d['status']['health']['status']}\")"

# 3. Trigger manual sync
curl -sk -X POST \
  -H "Host: argocd.lab.informationcart.com" \
  -H "Authorization: Bearer $ARGOCD_TOKEN" \
  -H "Content-Type: application/json" \
  https://192.168.1.100/api/v1/applications/apps/sync
```

**Verify rollout**:

```bash
kubectl rollout status deployment/otel-data-ui -n otel-data-ui --timeout=120s
```

### Step 6: Live Deployment Validation

Run the full validation checklist:

```bash
# 1. Health check — plain text response (NOT JSON)
curl -s https://data-ui.lab.informationcart.com/health
# Expected: "healthy" (plain text, not JSON)

# 2. Config.js shows correct version and settings
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- cat /usr/share/nginx/html/config.js
# Expected: window.__ENV__ = { ... APP_VERSION: "<NEW_VERSION>" ... }

# 3. Frontend loads
curl -s https://data-ui.lab.informationcart.com/ | head -5
# Expected: <!DOCTYPE html>

# 4. Config.js accessible via browser
curl -s https://data-ui.lab.informationcart.com/config.js
# Expected: window.__ENV__ = { GRAPHQL_URL: "...", ... }

# 5. Kubernetes pod status
kubectl get pods -n otel-data-ui -o wide
kubectl get deployment otel-data-ui -n otel-data-ui \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# 6. Verify ConfigMap has correct version
kubectl get configmap otel-data-ui-config -n otel-data-ui \
  -o jsonpath='{.data.VITE_APP_VERSION}'
```

**Important**: The health endpoint returns plain text `healthy` — NOT JSON
like other services. Do not pipe through `python3 -m json.tool` or `jq`.

## Implementation Checks

### Pre-Merge Checklist

| Check               | Command              | Expected                    |
| ------------------- | -------------------- | --------------------------- |
| ESLint              | `npm run lint`       | No errors                   |
| TypeScript          | `npm run type-check` | No errors                   |
| Build               | `npm run build`      | Compiles to dist/           |
| VERSION file format | `cat VERSION`        | `major.minor` (e.g., `1.0`) |
| No secrets          | `git diff --cached`  | No credentials              |

### Post-Build Checklist

| Check               | Command                                                 | Expected       |
| ------------------- | ------------------------------------------------------- | -------------- |
| Docker image exists | `docker manifest inspect stuartshay/otel-data-ui:<ver>` | JSON manifest  |
| Multi-arch          | Check manifest platforms                                | amd64 + arm64  |
| SHA tag matches     | Compare digests of version and SHA tags                 | Same digest    |
| Latest tag updated  | `docker manifest inspect ...latest`                     | Updated digest |

### Post-Deploy Checklist

| Check           | Command                                          | Expected               |
| --------------- | ------------------------------------------------ | ---------------------- |
| Pod running     | `kubectl get pods -n otel-data-ui`               | 1/1 Running            |
| Correct image   | `kubectl get deploy ... -o jsonpath='{..image}'` | New version            |
| Health endpoint | `curl .../health`                                | `healthy` (plain text) |
| config.js       | `kubectl exec ... -- cat .../config.js`          | `APP_VERSION: "<ver>"` |
| ConfigMap       | `kubectl get cm ... -o jsonpath='{..VERSION}'`   | New version            |
| HTML loads      | `curl .../`                                      | `<!DOCTYPE html>`      |
| No restarts     | `kubectl get pods`                               | RESTARTS = 0           |
| Argo CD synced  | `argocd app get apps --core`                     | Synced, Healthy        |

## Rollback Procedure

If a deployment has issues:

```bash
# 1. Find last working version
cd /home/ubuntu/git/k8s-gitops
git log --oneline apps/base/otel-data-ui/VERSION | head -5

# 2. Update to previous version
cd apps/base/otel-data-ui
./update-version.sh <PREVIOUS_VERSION>

# 3. Commit and push directly to develop, then PR to master
cd /home/ubuntu/git/k8s-gitops
git add -A
git commit -m "revert: Rollback otel-data-ui to v<PREVIOUS_VERSION>"
git push origin develop

# 4. Create and merge PR
gh pr create --base master --title "revert: Rollback otel-data-ui"
# Wait for CI, then merge

# 5. Force Argo CD sync
kubectl config set-context --current --namespace=argocd
argocd app sync apps --core --force

# 6. Verify rollback
kubectl rollout status deployment/otel-data-ui -n otel-data-ui
curl -s https://data-ui.lab.informationcart.com/health
# Expected: "healthy"
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- cat /usr/share/nginx/html/config.js | grep APP_VERSION
# Expected: APP_VERSION: "<PREVIOUS_VERSION>"
```

## Troubleshooting

### Docker Build Fails

**Check GitHub Actions**:
`https://github.com/stuartshay/otel-data-ui/actions/workflows/docker.yml`

**Common causes**:

- VERSION file missing or wrong format (must be `major.minor`)
- Docker Hub credentials expired (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`)
- TypeScript build error (`npm run build` fails)
- npm dependency resolution failure
- Vite build error (check for missing env vars in build output)

### Argo CD Stuck

```bash
# Check for stuck operations
argocd app get apps --core | grep -E 'Status|Operation'

# Terminate stuck operation
argocd app terminate-op apps --core

# Force sync after termination
sleep 5
argocd app sync apps --core --force --timeout 180
```

### Pod CrashLoopBackOff

```bash
# Check logs — entrypoint.sh runs before nginx
kubectl logs -n otel-data-ui -l app.kubernetes.io/name=otel-data-ui --tail=50

# Check events
kubectl describe pod -n otel-data-ui -l app.kubernetes.io/name=otel-data-ui

# Common causes:
# - entrypoint.sh fails (file permission issue)
# - nginx can't bind port 80 (security context issue)
# - Volume mounts not writable (securityContext/runAsUser mismatch)
# - Missing ConfigMap (otel-data-ui-config not deployed)
```

### ImagePullBackOff

```bash
# Verify image exists
docker manifest inspect stuartshay/otel-data-ui:<version>

# Check pull secret
kubectl get secret dockerhub-registry -n otel-data-ui

# Check events
kubectl describe pod -n otel-data-ui -l app.kubernetes.io/name=otel-data-ui
```

### Blank Page / App Doesn't Load

```bash
# Verify config.js was generated (entrypoint.sh ran)
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- cat /usr/share/nginx/html/config.js

# Check if static files were copied from template
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- ls -la /usr/share/nginx/html/

# Verify GraphQL URL is correct in config
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- cat /usr/share/nginx/html/config.js | grep GRAPHQL_URL
# Expected: GRAPHQL_URL: "https://gateway.lab.informationcart.com"

# Test GraphQL backend is reachable
curl -s https://gateway.lab.informationcart.com/ \
  -H 'Content-Type: application/json' \
  -d '{"query":"{health{status}}"}'
```

### Auth / Login Issues

```bash
# Verify Cognito redirect URI matches deployment
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- cat /usr/share/nginx/html/config.js | grep COGNITO_REDIRECT_URI
# Expected: https://data-ui.lab.informationcart.com/callback

# Verify ConfigMap has correct redirect URI
kubectl get configmap otel-data-ui-config -n otel-data-ui \
  -o jsonpath='{.data.VITE_COGNITO_REDIRECT_URI}'
# Expected: https://data-ui.lab.informationcart.com/callback
```

### otel-data-ui Branch Protection Rules

The `master` branch on `stuartshay/otel-data-ui` enforces these protections:

| Rule                             | Setting                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| Required status checks           | ESLint and TypeScript Check, Build Check, Dockerfile Lint, Security Audit |
| Strict status checks             | No                                                                        |
| Required approving reviews       | 0 (see note below)                                                        |
| Dismiss stale reviews            | No                                                                        |
| Required conversation resolution | Yes                                                                       |
| Enforce admins                   | Yes                                                                       |
| Allow force pushes               | No                                                                        |
| Allow deletions                  | No                                                                        |

**Note on review policy**: The `auto-approve.yml` workflow was intentionally
removed — all PRs are reviewed manually before merge. The
`required_approving_review_count: 0` setting allows the repo owner to merge
after self-review, since GitHub blocks self-approval.

To inspect current settings:

```bash
gh api repos/stuartshay/otel-data-ui/branches/master/protection \
  | python3 -m json.tool
```

### k8s-gitops Branch Protection Rules

The `master` branch on `stuartshay/k8s-gitops` enforces these protections:

| Rule                             | Setting                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| Required status checks           | Pre-commit, K8s Schema, K8s Best Practices, Kustomize Build |
| Strict status checks             | Yes (branch must be up-to-date)                             |
| Required approving reviews       | 1                                                           |
| GitHub Copilot code review       | **Yes** — auto review on every PR (~5+ min)                 |
| Dismiss stale reviews            | No                                                          |
| Required conversation resolution | **Yes** — all comments must be resolved                     |
| Enforce admins                   | Yes                                                         |
| Allow force pushes               | No                                                          |
| Allow deletions                  | No                                                          |

**Implications for deployments**:

- PRs must pass all 4 CI checks before merge is enabled
- At least 1 approving review is required
- **GitHub Copilot code review** runs automatically on every PR (~5+ minutes)
  — Copilot review comments must be resolved before merge
- All review comments/conversations must be marked resolved
- Even repo admins are subject to these rules (`enforce_admins: true`)
- Branch must be up-to-date with master (strict mode) — may require rebasing

To inspect current settings:

```bash
gh api repos/stuartshay/k8s-gitops/branches/master/protection \
  | python3 -m json.tool
```

### k8s-gitops PR Merge Conflict

The develop branch may diverge from master due to squash merges. Fix with:

```bash
cd /home/ubuntu/git/k8s-gitops
git checkout develop
git fetch origin master
git rebase origin/master
git push origin develop --force-with-lease
```

## Kubernetes Resources

| Resource       | Namespace    | Details                            |
| -------------- | ------------ | ---------------------------------- |
| Deployment     | otel-data-ui | 1 replica, RollingUpdate, non-root |
| Service        | otel-data-ui | ClusterIP :80                      |
| Ingress        | otel-data-ui | data-ui.lab.informationcart.com    |
| ConfigMap      | otel-data-ui | otel-data-ui-config                |
| SealedSecret   | otel-data-ui | dockerhub-registry                 |
| TLS Secret     | otel-data-ui | otel-data-ui-tls (cert-mgr)        |
| ServiceAccount | otel-data-ui | otel-data-ui                       |

### ConfigMap Values

```yaml
VITE_GRAPHQL_URL: 'https://gateway.lab.informationcart.com'
VITE_COGNITO_REDIRECT_URI: 'https://data-ui.lab.informationcart.com/callback'
VITE_APP_VERSION: '<current-version>'
```

## Quick Reference Commands

```bash
# Check deployed version
kubectl get deployment otel-data-ui -n otel-data-ui \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check runtime config version
kubectl exec -n otel-data-ui deploy/otel-data-ui \
  -- cat /usr/share/nginx/html/config.js | grep APP_VERSION

# View logs
kubectl logs -n otel-data-ui -l app.kubernetes.io/name=otel-data-ui -f

# Restart deployment (force config.js regeneration)
kubectl rollout restart deployment otel-data-ui -n otel-data-ui

# Check Argo CD sync status
kubectl config set-context --current --namespace=argocd
argocd app get apps --core | grep -E 'Sync|Health'

# Full validation one-liner
curl -s https://data-ui.lab.informationcart.com/health

# Find Docker image version
docker manifest inspect stuartshay/otel-data-ui:<tag> 2>&1 | head -3
```

## Version History

| Version | Date       | Changes                                                    |
| ------- | ---------- | ---------------------------------------------------------- |
| 1.0.16  | 2026-02-13 | Markdown lint fixes, setup.sh, pre-commit hooks, Node 24   |
| 1.0.7   | 2026-02-13 | Docker workflow alignment, version scheme, package updates |
