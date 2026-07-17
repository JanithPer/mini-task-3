import asyncio
import os

import arxiv

from backend.config import settings
from backend.ingestion import Paper


async def fetch_papers(target_count: int = 130) -> list[Paper]:
    pdf_dir = settings.INGEST_PDF_DIR
    os.makedirs(pdf_dir, exist_ok=True)

    existing_ids = _existing_arxiv_ids(pdf_dir)
    papers: list[Paper] = []
    seen_ids: set[str] = set(existing_ids)

    for file_path in _existing_pdf_paths(pdf_dir):
        arxiv_id = _id_from_path(file_path)
        papers.append(Paper(
            arxiv_id=arxiv_id,
            title="",
            abstract="",
            file_path=file_path,
        ))

    needed = max(0, target_count - len(papers))
    if needed == 0:
        return papers

    client = arxiv.Client()
    search = arxiv.Search(
        query="cat:cs.AI OR cat:cs.CL",
        max_results=needed * 3,
        sort_by=arxiv.SortCriterion.Relevance,
    )

    downloaded = 0
    for result in client.results(search):
        short_id = result.get_short_id()
        if short_id in seen_ids:
            continue
        seen_ids.add(short_id)

        file_path = os.path.join(pdf_dir, f"{short_id}.pdf")
        try:
            await asyncio.to_thread(
                result.download_pdf, dirpath=pdf_dir, filename=f"{short_id}.pdf"
            )
        except Exception as e:
            print(f"Download error for {short_id}: {e}")
            continue

        papers.append(Paper(
            arxiv_id=short_id,
            title=result.title or "",
            abstract=result.summary or "",
            file_path=file_path,
        ))
        downloaded += 1
        if len(papers) >= target_count:
            break

    print(f"Downloaded {downloaded} new papers, total: {len(papers)}")
    return papers


def _existing_arxiv_ids(pdf_dir: str) -> set[str]:
    return {_id_from_path(p) for p in _existing_pdf_paths(pdf_dir)}


def _existing_pdf_paths(pdf_dir: str) -> list[str]:
    if not os.path.isdir(pdf_dir):
        return []
    return [
        os.path.join(pdf_dir, f)
        for f in os.listdir(pdf_dir)
        if f.endswith(".pdf")
    ]


def _id_from_path(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]
