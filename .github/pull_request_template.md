## Summary

Refs #<!-- issue number — do NOT use "Closes" or "Fixes" (see below) -->

Describe the change and why it's needed.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New page / component
- [ ] UI enhancement (non-breaking)
- [ ] GraphQL query / mutation change
- [ ] CI/CD pipeline change
- [ ] Documentation update

## Checklist

- [ ] Read `README.md` and relevant docs
- [ ] No secrets or credentials committed
- [ ] Environment variables use `VITE_` prefix
- [ ] Ran `npm run lint:all` locally (hooks passing)
- [ ] Ran `npm run test` (tests passing)
- [ ] Ran `npm run type-check` (no type errors)

## Deployment

- [ ] Does this need [k8s-gitops](https://github.com/stuartshay/k8s-gitops)
      manifest changes?

## Testing

```bash
# Commands used to validate changes
npm run test
npm run lint:all
npm run type-check
npm run build
```

## Post-Merge Validation

⚠️ **Do NOT use `Closes #` or `Fixes #` in this PR.** Issues must remain open
until post-deploy acceptance criteria are validated on the cluster.

After this PR merges:

- [ ] Docker image built and pushed (CI)
- [ ] k8s-gitops deployment PR created and merged
- [ ] Argo CD synced to cluster
- [ ] Acceptance criteria validated against deployed behavior
- [ ] Final validation comment posted on the linked issue
- [ ] Issue closed manually after all criteria confirmed
- [ ] If any criterion cannot be validated, reason documented on the issue

## Notes

Any additional context, screenshots, or log output.
