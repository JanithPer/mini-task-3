from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str
    chunk_strategy: Literal["recursive", "semantic"] = "recursive"
    hybrid: bool = True
    rerank: bool = True
    contextual: bool = True
    top_k: int = Field(10, ge=5, le=50)


class SearchResultItem(BaseModel):
    rank: int
    chunk_id: str
    content: str
    contextualized_content: str | None
    score: float
    document_title: str
    arxiv_id: str
    chunk_strategy: Literal["recursive", "semantic"]


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    elapsed_ms: float
    query: str
    params_applied: SearchRequest


class CostBreakdown(BaseModel):
    embedding: float
    context_gen: float
    query_rewrite: float
    rerank: float
    total: float


class StatsData(BaseModel):
    total_documents: int
    total_chunks: int
    last_ingested_at: datetime | None
    ingestion_cost_per_1k: CostBreakdown
    avg_query_cost: CostBreakdown


class BenchmarkResult(BaseModel):
    strategy: str
    recall_5: float
    recall_10: float
    mrr: float
    avg_query_time_ms: float
    avg_cost: float


class BenchmarkResponse(BaseModel):
    results: list[BenchmarkResult]
    run_at: datetime | None


class IngestionStatus(BaseModel):
    task_id: str
    status: Literal["pending", "running", "completed", "failed"]
    progress: int
    total: int
    message: str | None
    started_at: datetime
    finished_at: datetime | None


class BenchmarkStatus(BaseModel):
    run_id: str
    status: Literal["pending", "running", "completed", "failed", "cancelled"]
    progress: int
    total: int
    message: str | None
    started_at: datetime
    finished_at: datetime | None


class CancelRequest(BaseModel):
    run_id: str


class ErrorResponse(BaseModel):
    error: dict[str, str]
