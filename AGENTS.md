# Repository maintenance rules

- Treat this repository checkout as the single editable source of truth. A local Codex Skill installation may symlink to this checkout; do not edit backup copies or sync an installed copy back over the repository.
- Preserve unrelated working-tree changes. Put substantive experiments on a topic branch rather than leaving them on `main`.
- Before reporting a local Skill change as validated, run `npm run verify` and the Skill Creator `quick_validate.py` check against this checkout.
- A local experiment does not require a version bump. Before an application consumes a candidate, make it reproducible with an exact commit or release-candidate artifact.
- Do not commit, push, tag, publish a Release, update an application lock, or deploy unless the user explicitly requests that action.
- Stable application and production integrations must use an immutable version, exact commit, and artifact checksum. They must not follow a developer working tree, `main`, or `latest` automatically.
