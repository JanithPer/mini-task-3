from dataclasses import dataclass


@dataclass
class ScoredChunk:
    id: int
    document_id: int
    strategy: str
    content: str
    contextualized_content: str | None
    score: float
    document_title: str
    arxiv_id: str
