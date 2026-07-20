# Retrieval Engine

RAG benchmark over arXiv papers. Search, evaluate, and compare vector, hybrid (RRF), rerank, and contextual retrieval strategies.

![Search Page](screenshot-1.png)
![Stats Page](screenshot-2.png)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + FastAPI |
| Vector DB | PostgreSQL 16 + pgvector + HNSW |
| PDF Parsing | Docling |
| Embeddings | all-MiniLM-L6-v2 (384d, local) |
| Context / Query Rewrite | GPT-4o-mini |
| Reranking | BAAI/bge-reranker-base (local) |
| Frontend | Vite + React 18 + TypeScript + Tailwind |

## Setup

```bash
cp .env.example .env  # fill in OPENAI_API_KEY
docker compose up -d postgres
uv sync
uv run python -m backend.ingestion.pipeline
uv run uvicorn backend.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | Health check (DB connectivity) |
| `POST` | `/api/search` | Search with strategy params |
| `POST` | `/api/ingest` | Trigger ingestion (returns task_id) |
| `GET` | `/api/ingest/status/{task_id}` | Poll ingestion progress |
| `GET` | `/api/stats` | Aggregated stats + costs |
| `GET` | `/api/stats/detail` | Cost breakdown by component |
| `POST` | `/api/benchmark` | Run benchmark (returns run_id) |
| `GET` | `/api/benchmark/status/{run_id}` | Poll benchmark progress |
| `GET` | `/api/benchmark/results` | Latest benchmark results |
| `POST` | `/api/benchmark/cancel` | Cancel a running benchmark |

## Quality Gates

```bash
# Backend
uv run ruff check .
uv run mypy backend
uv run pytest

# Frontend
cd frontend
npm run typecheck
npm run build
```
