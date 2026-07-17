from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql://retrieval:retrieval@localhost:5433/retrieval"
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    CONTEXT_MODEL: str = "gpt-4o-mini"
    RERANK_MODEL: str = "BAAI/bge-reranker-base"
    INGEST_PDF_DIR: str = "./data/pdfs"
    REQUEST_TIMEOUT_S: int = 30


settings = Settings()
