from dataclasses import dataclass, field


@dataclass
class Paper:
    arxiv_id: str
    title: str
    abstract: str
    file_path: str


@dataclass
class ParsedDoc:
    arxiv_id: str
    title: str
    markdown: str
    summary: str


@dataclass
class Chunk:
    content: str
    token_count: int


@dataclass
class IngestionSummary:
    papers_downloaded: int = 0
    papers_parsed: int = 0
    chunks_created: int = 0
    chunks_embedded: int = 0
    errors: list[str] = field(default_factory=list)
