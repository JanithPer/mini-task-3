from backend.routes.benchmark import router as benchmark_router
from backend.routes.ingest import router as ingest_router
from backend.routes.search import router as search_router
from backend.routes.stats import router as stats_router

routers = [search_router, ingest_router, stats_router, benchmark_router]
