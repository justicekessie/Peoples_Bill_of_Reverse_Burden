# Contributing to People's Bill Platform (Ghana)

Thank you for helping improve the platform.

## Development principles

- Keep changes focused and small.
- Preserve citizen safety and privacy in all features.
- Prefer clear, documented behavior over clever code.
- Add or update docs when changing setup, APIs, or workflows.

## Local setup

1. Follow the project setup steps in `README.md`.
2. Start backend (`uvicorn main:app --reload --port 8000`) and frontend (`npm run dev`) in separate terminals.
3. Confirm the API docs load at `http://localhost:8000/docs`.

## Branching and commits

- Create a feature branch from the active integration branch.
- Use clear commit messages:
  - `feat: ...`
  - `fix: ...`
  - `docs: ...`
  - `refactor: ...`
  - `test: ...`

## Coding expectations

### Backend (FastAPI/Python)

- Keep endpoint logic thin; move reusable logic into `services.py`.
- Validate request models with Pydantic.
- Return consistent HTTP status codes and error details.
- Avoid introducing blocking long-running tasks in request handlers.

### Frontend (Next.js/TypeScript)

- Keep components composable and focused.
- Avoid hardcoding API URLs; use environment variables.
- Handle loading and error states for API requests.

## Database and migrations

- For schema changes, include a migration in `migrations/`.
- Keep migration names descriptive and ordered consistently.
- Ensure seed data updates are idempotent where possible.

## Testing and validation

Before opening a PR, run the checks that apply to your changes.

### Backend

```bash
cd backend
python -m py_compile main.py services.py models.py auth.py
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

If your environment cannot run a check (for example, missing local services), document what you could run and why others were skipped.

## Pull request checklist

- [ ] Change is scoped and explained.
- [ ] Docs updated (README/API docs/env examples) if needed.
- [ ] Database migration added for schema changes.
- [ ] Relevant checks executed locally.
- [ ] Screenshots included for visible UI changes.

## Security and responsible disclosure

If you discover a security issue, do not open a public issue with exploit details. Share a minimal report with maintainers first.

Thanks again for contributing to Ghana's civic technology ecosystem.
