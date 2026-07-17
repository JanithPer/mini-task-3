import asyncio
import os

from docling.document_converter import DocumentConverter

from backend.ingestion import ParsedDoc

_converter: DocumentConverter | None = None


def _get_converter() -> DocumentConverter:
    global _converter
    if _converter is None:
        _converter = DocumentConverter()
    return _converter


async def parse_pdf(path: str) -> ParsedDoc:
    arxiv_id = os.path.splitext(os.path.basename(path))[0]

    converter = _get_converter()
    result = await asyncio.to_thread(converter.convert, path)
    markdown = result.document.export_to_markdown()

    title = arxiv_id
    try:
        first_line = markdown.strip().split("\n")[0].lstrip("#").strip()
        if first_line:
            title = first_line
    except Exception:
        pass

    summary = markdown[:500]

    return ParsedDoc(
        arxiv_id=arxiv_id,
        title=title,
        markdown=markdown,
        summary=summary,
    )
