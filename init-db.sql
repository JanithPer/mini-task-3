CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    arxiv_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    file_path TEXT,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL CHECK (strategy IN ('recursive','semantic')),
    content TEXT NOT NULL,
    contextualized_content TEXT,
    embedding vector(1536),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    token_count INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(contextualized_content, content))) STORED
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_strategy ON chunks (document_id, strategy);
CREATE INDEX IF NOT EXISTS idx_chunks_content_tsv ON chunks USING GIN (content_tsv);

CREATE TABLE IF NOT EXISTS benchmark_runs (
    id BIGSERIAL PRIMARY KEY,
    run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    strategy TEXT NOT NULL,
    results JSONB NOT NULL,
    cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ingestion_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('pending','running','complete','error')),
    progress INT NOT NULL DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cost_events (
    id BIGSERIAL PRIMARY KEY,
    component TEXT NOT NULL CHECK (component IN ('embedding','context_gen','query_rewrite','rerank')),
    tokens_in BIGINT NOT NULL DEFAULT 0,
    tokens_out BIGINT NOT NULL DEFAULT 0,
    units BIGINT NOT NULL DEFAULT 0,
    cost_usd NUMERIC(12,6) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
