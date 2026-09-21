.PHONY: setup env install migrate seed dev dev-backend dev-frontend test lint typecheck

setup: env install
	cd backend && uv run python -m app.seed

env:
	if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
	if [ ! -f frontend/.env.local ]; then cp frontend/.env.example frontend/.env.local; fi

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
