import asyncio
from backend.ingestion.chunk_recursive import chunk_recursive
from backend.ingestion.contextualize import contextualize_chunks
from backend.ingestion import ParsedDoc


async def test():
    doc = ParsedDoc(
        arxiv_id="test-001",
        title="Test",
        markdown="Hello world. This is a test document about AI.\n\nIt has multiple paragraphs.\n\nMachine learning is great." * 5,
        summary="Hello world. This is a test document about AI.",
    )

    chunks = chunk_recursive(doc.markdown)
    print(f"Chunks: {len(chunks)}")

    print("Calling contextualize...")
    contexts = await contextualize_chunks(doc, chunks)
    print(f"Contexts: {len(contexts)}")
    for i, c in enumerate(contexts[:3]):
        print(f"  [{i}]: {c[:50] if c else '(empty)'}")

    print("Done")


asyncio.run(test())
