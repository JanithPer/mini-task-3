from dataclasses import dataclass, field


@dataclass
class BenchmarkQuery:
    id: str
    query: str
    golden_chunks: list[str] = field(default_factory=list)


@dataclass
class StrategyResult:
    strategy: str
    recall_5: float
    recall_10: float
    mrr: float
    avg_query_time_ms: float
    avg_cost: float
    cost_breakdown: dict[str, float] = field(default_factory=dict)


@dataclass
class BenchmarkRun:
    results: list[StrategyResult]
    run_at: str
