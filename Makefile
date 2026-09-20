.PHONY: install migrate seed dev dev-backend dev-frontend test lint typecheck

install:
	cd backend && uv sync
	cd frontend && npm ci
	$(MAKE) migrate

migrate:
	cd backend && uv run alembic upgrade head

seed: migrate
	cd backend && uv run python -m app.seed

dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend: migrate
	cd backend && uv run uvicorn app.main:app --reload

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && uv run pytest
	cd frontend && npm test

lint:
	cd backend && uv run ruff check .
	cd frontend && npm run lint

typecheck:
	cd backend && uv run pyright
