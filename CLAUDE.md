# job-kit-ai

- `server/`: TypeScript event-sourced API. Rules in `server/CLAUDE.md`, detail in `server/CONVENTIONS.md`.
- `app/`: React + Vite UI. Rules in `app/CLAUDE.md`, detail in `app/CONVENTIONS.md` and `app/DESIGN_SYSTEM.md`.
- `skill/`, `scripts/`, `tests/`: job-* skills and installers, tested by `scripts/test.sh`.

## Every change

- Never commit secrets, tokens, or `.env` files.
- Workflows that use `CLAUDE_CODE_OAUTH_TOKEN` keep their trigger gates: `claude.yml` runs only for OWNER/MEMBER/COLLABORATOR authors, and `claude-review.yml` skips fork PRs.
