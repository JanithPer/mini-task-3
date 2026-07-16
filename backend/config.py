from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql://retrieval:retrieval@localhost:5433/retrieval"
    OPENAI_API_KEY: str = ""
    COHERE_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536
    CONTEXT_MODEL: str = "gpt-4o-mini"
    RERANK_MODEL: str = "rerank-english-v3.0"
    INGEST_PDF_DIR: str = "./data/pdfs"
    REQUEST_TIMEOUT_S: int = 30


settings = Settings()
