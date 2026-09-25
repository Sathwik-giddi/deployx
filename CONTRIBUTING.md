# Contributing to DEPLOYX

Thanks for helping improve DEPLOYX. The project is a simulation-first reference implementation, so contributions should make the boundaries, evidence, and failure modes easier to understand.

## Before you start

1. Read the root [README.md](README.md) and [SECURITY.md](SECURITY.md).
2. Check existing issues and pull requests before starting overlapping work.
3. Keep changes focused. A small, reviewable change is easier to maintain than a broad rewrite.
4. Do not add real customer data, credentials, tokens, private endpoints, or production identifiers.

## Development setup

Install the web dependencies from the repository root:

```bash
pnpm install
```

Set up the control plane in a separate terminal:

```bash
cd apps/control-plane
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
```

The web console uses local fixtures by default. The FastAPI service is optional for exploring the API boundary. ACME-LAB is optional and is configured under `infra/acme-lab`.

## Quality checks

Run the checks that apply to your change:

```bash
pnpm lint
pnpm typecheck
pnpm build

cd apps/control-plane
ruff check .
mypy app
pytest
```

CI is the shared source of truth. If a check cannot run in your environment, explain why in the pull request instead of removing the check.

## Contribution guidelines

- Add or update focused tests for domain behavior and state transitions.
- Keep simulation labels visible when a fixture could otherwise be mistaken for live data.
- Prefer explicit, typed boundaries over hidden client-side substitutions.
- Keep the web console responsive and keyboard accessible.
- Do not add deployment execution or provider access without a clear threat model and a separate review.
- Update the README when a command, endpoint, or supported workflow changes.

## Pull requests

Use a descriptive title, explain the user or operator problem being addressed, and include the checks you ran. A pull request that changes a domain model should also update the relevant fixtures and tests.
