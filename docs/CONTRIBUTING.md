# Contributing to USURP

## Prerequisites

- [Bun](https://bun.sh) v1.x
- [Foundry](https://getfoundry.sh) (for contract work)
- Node 18+

## Setup

```bash
git clone https://github.com/PASdeco/usurp.git
cd usurp
bun install
```

Copy `docs/ENV_EXAMPLE.md` and create `.env` with the required values.

## Development

```bash
bun run dev          # Start Vite dev server on :5173
VITE_MOCK_MODE=true bun run dev   # Run with mock game state (no wallet needed)
```

## Contract Work

```bash
bun run contracts:build   # forge build
bun run contracts:test    # forge test -vv
```

All contract changes must pass the full test suite (66 tests) before being considered.

## Code Style

- TypeScript strict mode — no `any`, no implicit returns
- Tailwind utility classes only — no inline styles except for dynamic values
- No emoji in UI copy
- Language rules: never use "guaranteed", "passive income", "invest", "earn money" — use "drip", "holds", "play"

## Branching

- `main` — production; deploys automatically to `usurp-arena.vercel.app`
- Feature branches: `feat/<name>`
- Fix branches: `fix/<name>`

## Pull Requests

1. Branch from `main`
2. Run `bun run contracts:test` — all 66 must pass
3. Run `bunx vite build` — must succeed with no errors
4. Open PR against `main` with a clear description of what changed and why

## Environment Variables

See `docs/ENV_EXAMPLE.md` for the full list. Never commit `.env` — it is in `.gitignore`.

## Deployment

Production deploys to Vercel are triggered manually. See `docs/DEPLOY.md` for the full checklist.
