# Conventions

## Branching
- main is protected; PRs only.
- feature/<scope>-<desc> (e.g., feature/web-shell)

## Commits
- Conventional commits: feat:, fix:, chore:, docs:, refactor:, test:, perf:

## Env
- No secrets in git.
- Every app maintains a .env.example. Real values go in .env.local (gitignored).

## Reviews & CI
- PR must pass lint/build CI.
- PR description includes: Summary, Test Plan, Screenshots (if UI), Checklist.

## Decision Log
- Any structural/architectural change → add an ADR under docs/ADRs/.
